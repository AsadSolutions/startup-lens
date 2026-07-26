import asyncio
import time
from typing import AsyncIterator, Awaitable, Callable, TypeVar

from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel

from app.config import settings
from app.graph.llm import llm_for_role, structured_call
from app.mcp.client import web_search
from app.models import (
    Analysis,
    NodeName,
    ResearchFindings,
    TeamBrief,
    TeamFailure,
    TeamReport,
)

SchemaT = TypeVar("SchemaT", bound=BaseModel)
CallLLM = Callable[[type[SchemaT], str], Awaitable[SchemaT]]
Search = Callable[[str], Awaitable[list[dict]]]


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
    call_llm: CallLLM | None = None,
) -> ResearchFindings:
    call_llm = call_llm or _default_call_llm("researcher")
    query = f"{brief.focus} {' '.join(brief.key_questions)}"
    raw_results = await search(query)
    prompt = (
        f"Team: {brief.team}\nFocus: {brief.focus}\n"
        f"Key questions: {brief.key_questions}\n\n"
        f"Raw web search results (JSON):\n{raw_results}\n\n"
        "Extract the relevant findings as ResearchFindings: for each finding, "
        "a one sentence summary, the source (title/url), and a short snippet."
    )
    return await call_llm(ResearchFindings, prompt)


async def analyst_node(
    brief: TeamBrief,
    findings: ResearchFindings,
    *,
    call_llm: CallLLM | None = None,
) -> Analysis:
    call_llm = call_llm or _default_call_llm("analyst")
    prompt = (
        f"Team: {brief.team}\nFocus: {brief.focus}\n\n"
        f"Research findings:\n{findings.model_dump_json(indent=2)}\n\n"
        "Analyze these findings: produce key_insights and risks."
    )
    return await call_llm(Analysis, prompt)


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
            findings = await researcher_node(brief, search=search, call_llm=call_llm)
            tokens_used += _estimate_tokens(findings)
            if tokens_used >= token_budget:
                truncated = True
                return
            analysis = await analyst_node(brief, findings, call_llm=call_llm)
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
