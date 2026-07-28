import asyncio
import time
from typing import AsyncIterator, Awaitable, Callable, TypeVar

from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel

from app.config import settings
from app.graph.llm import llm_for_role, structured_call
from app.mcp.client import run_sandbox_calculation, web_search
from app.models import (
    Analysis,
    NodeName,
    ResearchFinding,
    ResearchFindings,
    TeamBrief,
    TeamFailure,
    TeamName,
    TeamReport,
)

SchemaT = TypeVar("SchemaT", bound=BaseModel)
CallLLM = Callable[[type[SchemaT], str], Awaitable[SchemaT]]
Search = Callable[[str], Awaitable[list[dict]]]
Retrieve = Callable[[str, int], Awaitable[list[ResearchFinding]]]
Calculate = Callable[[str], Awaitable[dict]]


def _default_retrieve(team: TeamName) -> Retrieve:
    import functools

    from app.rag.retrieve import retrieve_for_team

    return functools.partial(retrieve_for_team, team)


def _default_calculate() -> Calculate:
    return run_sandbox_calculation


class TeamState(BaseModel):
    brief: TeamBrief
    findings: ResearchFindings | None = None
    analysis: Analysis | None = None
    report: TeamReport | None = None


def _default_call_llm(role: str) -> CallLLM:
    llm = llm_for_role(role)
    return lambda schema, prompt: structured_call(llm, schema, prompt)


async def researcher_node(
    brief: TeamBrief,
    *,
    search: Search = web_search,
    retrieve: Retrieve | None = None,
    call_llm: CallLLM | None = None,
) -> ResearchFindings:
    call_llm = call_llm or _default_call_llm("researcher")
    retrieve = retrieve or _default_retrieve(brief.team)
    query = f"{brief.focus} {' '.join(brief.key_questions)}"
    raw_results, rag_hits = await asyncio.gather(search(query), retrieve(query, 1))
    prompt = (
        f"Team: {brief.team}\nFocus: {brief.focus}\n"
        f"Key questions: {brief.key_questions}\n\n"
        f"Raw web search results (JSON):\n{raw_results}\n\n"
        "Curated knowledge base hits for this team (JSON):\n"
        f"{[hit.model_dump() for hit in rag_hits]}\n\n"
        "Extract the relevant findings as ResearchFindings, fusing both "
        "sources: for each finding, a one sentence summary, the source "
        "(title/url/published), and a short snippet."
    )
    return await call_llm(ResearchFindings, prompt)


def _analyst_prompt(brief: TeamBrief, findings: ResearchFindings, hop: int, max_hops: int) -> str:
    remaining = max_hops - hop
    return (
        f"Team: {brief.team}\nFocus: {brief.focus}\n\n"
        f"Research findings so far (hop {hop} of {max_hops}):\n"
        f"{findings.model_dump_json(indent=2)}\n\n"
        "Analyze these findings: produce key_insights and risks. If a "
        "specific piece of missing information would meaningfully improve "
        "this analysis (for example, a competitor mentioned above but "
        f"missing its funding), and {remaining} follow-up hop(s) remain, set "
        "follow_up_query to one specific search query for it; otherwise "
        "leave follow_up_query null. If a calculation would help (market "
        "sizing arithmetic, score aggregation), set calculation_expression "
        "to a single arithmetic expression whose value is the answer — no "
        "assignments or statements, only numbers, the operators "
        "+ - * / // % **, and calls to abs/min/max/round/sum/len/pow/sqrt/mean."
    )


async def analyst_node(
    brief: TeamBrief,
    findings: ResearchFindings,
    *,
    call_llm: CallLLM | None = None,
    retrieve: Retrieve | None = None,
    calculate: Calculate | None = None,
    max_hops: int | None = None,
) -> Analysis:
    """Reasons over findings and may (a) issue follow-up RAG retrievals based
    on what it's seen so far, capped at `max_hops` total hops including the
    researcher's initial one (ENGINEERING_PRINCIPLES.md #3), and (b) run a
    calculation in the MCP sandbox. The LLM decides *what* to ask for or
    calculate; the loop bound and whether the sandbox actually runs is code,
    never the model (ENGINEERING_PRINCIPLES.md #1, the determinism boundary)."""
    call_llm = call_llm or _default_call_llm("analyst")
    retrieve = retrieve or _default_retrieve(brief.team)
    calculate = calculate or _default_calculate()
    max_hops = max_hops if max_hops is not None else settings.rag_max_hops

    hop = 1
    current_findings = findings
    analysis = await call_llm(Analysis, _analyst_prompt(brief, current_findings, hop, max_hops))
    while analysis.follow_up_query and hop < max_hops:
        hop += 1
        new_findings = await retrieve(analysis.follow_up_query, hop)
        current_findings = ResearchFindings(
            team=findings.team, findings=current_findings.findings + new_findings
        )
        analysis = await call_llm(Analysis, _analyst_prompt(brief, current_findings, hop, max_hops))

    if analysis.calculation_expression:
        outcome = await calculate(analysis.calculation_expression)
        analysis = analysis.model_copy(update={"calculation_result": str(outcome.get("result"))})

    return analysis


async def writer_node(
    brief: TeamBrief,
    findings: ResearchFindings,
    analysis: Analysis | None,
    *,
    call_llm: CallLLM | None = None,
) -> TeamReport:
    call_llm = call_llm or _default_call_llm("writer")
    sources = [f.source.model_dump() for f in findings.findings]
    analysis_text = (
        analysis.model_dump_json(indent=2)
        if analysis is not None
        else "No analysis available: budget or timeout was reached before the "
        "analyst ran. Write the best possible report from findings alone."
    )
    prompt = (
        f"Team: {brief.team}\n\n"
        f"Analysis:\n{analysis_text}\n\n"
        f"Available sources:\n{sources}\n\n"
        "Write the final TeamReport: summary, key_insights, risks, sources "
        "(reuse the available sources), truncated=false."
    )
    return await call_llm(TeamReport, prompt)


def _estimate_tokens(model: BaseModel) -> int:
    """Deterministic, code-enforced proxy for token spend (CLAUDE.md rule 5):
    real per-call usage metadata isn't plumbed through `call_llm` yet, so cost
    is estimated from structured output size using the ~4-chars-per-token
    rule of thumb."""
    return len(model.model_dump_json()) // 4


async def run_team(
    brief: TeamBrief,
    *,
    search: Search = web_search,
    retrieve: Retrieve | None = None,
    calculate: Calculate | None = None,
    call_llm: CallLLM | None = None,
    token_budget: int | None = None,
    timeout_seconds: float | None = None,
) -> TeamReport | TeamFailure:
    """Runs one team's researcher -> analyst -> writer pipeline with the token
    budget and wall-clock timeout enforced in code (CLAUDE.md rule 5). A
    breach (budget or timeout) skips straight to the writer with whatever
    findings/analysis already exist and flags the report `truncated`; any
    other exception is caught and returned as a `TeamFailure` — failure is
    data, not an exception (ARCHITECTURE.md, ENGINEERING_PRINCIPLES.md #2).
    token_budget/timeout_seconds default to None so they're read from
    `settings` at call time rather than baked in as import-time defaults,
    which would otherwise ignore runtime config changes."""
    token_budget = token_budget if token_budget is not None else settings.team_token_budget
    timeout_seconds = (
        timeout_seconds if timeout_seconds is not None else settings.team_timeout_seconds
    )
    findings: ResearchFindings | None = None
    analysis: Analysis | None = None
    tokens_used = 0
    truncated = False
    deadline = time.monotonic() + timeout_seconds

    try:

        async def _gather() -> None:
            nonlocal findings, analysis, tokens_used, truncated
            findings = await researcher_node(brief, search=search, retrieve=retrieve, call_llm=call_llm)
            tokens_used += _estimate_tokens(findings)
            if tokens_used >= token_budget:
                truncated = True
                return
            analysis = await analyst_node(
                brief, findings, call_llm=call_llm, retrieve=retrieve, calculate=calculate
            )
            tokens_used += _estimate_tokens(analysis)
            if tokens_used >= token_budget:
                truncated = True

        remaining = max(deadline - time.monotonic(), 0)
        try:
            await asyncio.wait_for(_gather(), timeout=remaining)
        except asyncio.TimeoutError:
            truncated = True

        report = await writer_node(
            brief,
            findings or ResearchFindings(team=brief.team, findings=[]),
            analysis,
            call_llm=call_llm,
        )
        if truncated:
            report = report.model_copy(update={"truncated": True})
        return report
    except Exception as exc:
        return TeamFailure(team=brief.team, error=str(exc))


async def _researcher_wrapper(state: TeamState) -> dict:
    return {"findings": await researcher_node(state.brief)}


async def _analyst_wrapper(state: TeamState) -> dict:
    return {"analysis": await analyst_node(state.brief, state.findings)}


async def _writer_wrapper(state: TeamState) -> dict:
    return {
        "report": await writer_node(state.brief, state.findings, state.analysis)
    }


def build_team_graph():
    graph = StateGraph(TeamState)
    graph.add_node(NodeName.RESEARCHER, _researcher_wrapper)
    graph.add_node(NodeName.ANALYST, _analyst_wrapper)
    graph.add_node(NodeName.WRITER, _writer_wrapper)
    graph.add_edge(START, NodeName.RESEARCHER)
    graph.add_edge(NodeName.RESEARCHER, NodeName.ANALYST)
    graph.add_edge(NodeName.ANALYST, NodeName.WRITER)
    graph.add_edge(NodeName.WRITER, END)
    return graph.compile()


_team_graph = build_team_graph()


async def run_team_streaming(brief: TeamBrief) -> AsyncIterator[tuple[str, dict]]:
    async for update in _team_graph.astream(
        TeamState(brief=brief), stream_mode="updates"
    ):
        for node_name, node_output in update.items():
            yield node_name, node_output
