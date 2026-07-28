import operator
import uuid
from typing import Annotated, Awaitable, Callable, TypeVar

from langgraph.graph import END, START, StateGraph
from langgraph.types import Send
from pydantic import BaseModel, Field

from app.graph.checkpoint import get_checkpointer
from app.graph.llm import llm_for_role, structured_call
from app.graph.team import Retrieve, Search, run_team
from app.mcp.client import web_search
from app.models import (
    ComposerSynthesis,
    FinalReport,
    IdeaSpec,
    TeamBrief,
    TeamBriefSet,
    TeamFailure,
    TeamName,
    TeamReport,
)

SchemaT = TypeVar("SchemaT", bound=BaseModel)
CallLLM = Callable[[type[SchemaT], str], Awaitable[SchemaT]]


def reject_if_blank(raw_idea: str) -> str:
    """Single source of truth for "what makes an idea blank" — used by both
    intake() and the API layer's request validator (routers/validate.py) so
    the rule is expressed once."""
    idea_text = raw_idea.strip()
    if not idea_text:
        raise ValueError("idea must not be blank")
    return idea_text


def intake(raw_idea: str) -> IdeaSpec:
    return IdeaSpec(idea=reject_if_blank(raw_idea))


def _default_call_llm(role: str) -> CallLLM:
    llm = llm_for_role(role)
    return lambda schema, prompt: structured_call(llm, schema, prompt)


async def planner(
    idea: IdeaSpec, *, call_llm: CallLLM | None = None
) -> dict[TeamName, TeamBrief]:
    """One LLM call producing a TeamBrief for every team. There is no separate
    industry/geography input: the model infers industry and market context
    directly from the idea text and folds that inference into each team's
    focus and key_questions. The planner is the only component that reads
    the raw idea text (ARCHITECTURE.md context firewall #1) — every team
    downstream sees only its own TeamBrief."""
    call_llm = call_llm or _default_call_llm("planner")
    prompt = (
        f"Startup idea: {idea.idea}\n\n"
        "First, infer the industry/sector and the likely target market or "
        "geography implied by the idea text itself — the idea text is the "
        "only input, there is no separate industry or geography field.\n\n"
        "Then produce a TeamBriefSet with exactly one TeamBrief per team "
        f"({', '.join(t.value for t in TeamName)}): for each, focus is one "
        "paragraph describing what that specific team should research for "
        "this specific idea given the industry and market you inferred, and "
        "key_questions is 3 to 5 concrete questions scoped to that team."
    )
    brief_set = await call_llm(TeamBriefSet, prompt)
    return {brief.team: brief for brief in brief_set.briefs}


async def composer(
    idea: IdeaSpec,
    team_results: list[TeamReport | TeamFailure],
    *,
    call_llm: CallLLM | None = None,
) -> FinalReport:
    """Strong-model merge of the five team results into a FinalReport
    (ARCHITECTURE.md). Only the executive summary and contradictions are
    LLM-generated; team_reports/team_failures are attached directly from
    code, never re-synthesized (ENGINEERING_PRINCIPLES.md context discipline
    #6 — bounded TeamReport shape)."""
    call_llm = call_llm or _default_call_llm("composer")
    reports = [r for r in team_results if isinstance(r, TeamReport)]
    failures = [r for r in team_results if isinstance(r, TeamFailure)]
    prompt = (
        f"Startup idea: {idea.idea}\n\n"
        f"Team reports:\n{[r.model_dump() for r in reports]}\n\n"
        f"Teams that failed to report:\n{[f.model_dump() for f in failures]}\n\n"
        "Produce a ComposerSynthesis: executive_summary is a short paragraph "
        "synthesizing the reports into an overall readiness read, honestly "
        "noting any teams that failed; contradictions lists any specific "
        "disagreements between two or more teams' findings, each naming the "
        "teams involved and describing the disagreement — empty if none. Do "
        "not restate each team's full content."
    )
    synthesis = await call_llm(ComposerSynthesis, prompt)
    return FinalReport(
        idea=idea,
        executive_summary=synthesis.executive_summary,
        team_reports=reports,
        team_failures=failures,
        contradictions=synthesis.contradictions,
    )


class RunState(BaseModel):
    raw_idea: str
    idea: IdeaSpec | None = None
    team_briefs: dict[TeamName, TeamBrief] = Field(default_factory=dict)
    team_results: Annotated[list[TeamReport | TeamFailure], operator.add] = Field(
        default_factory=list
    )
    final_report: FinalReport | None = None


class _TeamDispatch(BaseModel):
    brief: TeamBrief


def build_orchestrator_graph(
    *,
    checkpointer=None,
    planner_call_llm: CallLLM | None = None,
    team_call_llm_factory: Callable[[TeamName], CallLLM | None] | None = None,
    team_search: Search = web_search,
    team_retrieve_factory: Callable[[TeamName], Retrieve | None] | None = None,
    composer_call_llm: CallLLM | None = None,
):
    """Builds the Phase 2 orchestrator graph: intake -> planner -> Send()
    fan-out to one run_team() call per team -> fan_in -> composer. The
    *_call_llm/team_search hooks exist purely for dependency injection in
    tests; production callers leave them None/default and every node resolves
    its own role's model from config (CLAUDE.md rule 9)."""

    async def _intake_node(state: RunState) -> dict:
        return {"idea": intake(state.raw_idea)}

    async def _planner_node(state: RunState) -> dict:
        briefs = await planner(state.idea, call_llm=planner_call_llm)
        return {"team_briefs": briefs}

    def _fan_out_to_teams(state: RunState) -> list[Send]:
        return [
            Send("run_team", {"brief": brief})
            for brief in state.team_briefs.values()
        ]

    async def _run_team_node(state: dict) -> dict:
        # Send() delivers its payload as a raw dict, not coerced against
        # _TeamDispatch (that schema only documents the shape) — validate it
        # explicitly here.
        brief = _TeamDispatch.model_validate(state).brief
        call_llm = team_call_llm_factory(brief.team) if team_call_llm_factory else None
        retrieve = team_retrieve_factory(brief.team) if team_retrieve_factory else None
        result = await run_team(brief, search=team_search, retrieve=retrieve, call_llm=call_llm)
        return {"team_results": [result]}

    async def _fan_in_node(state: RunState) -> dict:
        # No-op merge point: the team_results reducer (operator.add) has
        # already merged the concurrent writes from all five run_team Send()
        # branches by the time this node runs (LangGraph waits for every
        # branch targeting this node's predecessor before running it). This
        # node exists as its own checkpoint boundary and gives the composer
        # one predecessor instead of five dynamic ones.
        return {}

    async def _composer_node(state: RunState) -> dict:
        final_report = await composer(
            state.idea, state.team_results, call_llm=composer_call_llm
        )
        return {"final_report": final_report}

    graph = StateGraph(RunState)
    graph.add_node("intake", _intake_node)
    graph.add_node("planner", _planner_node)
    graph.add_node("run_team", _run_team_node)
    graph.add_node("fan_in", _fan_in_node)
    graph.add_node("composer", _composer_node)
    graph.add_edge(START, "intake")
    graph.add_edge("intake", "planner")
    graph.add_conditional_edges("planner", _fan_out_to_teams, ["run_team"])
    graph.add_edge("run_team", "fan_in")
    graph.add_edge("fan_in", "composer")
    graph.add_edge("composer", END)
    return graph.compile(checkpointer=checkpointer)


async def run_orchestrator(
    raw_idea: str, *, thread_id: str | None = None
) -> FinalReport:
    """Production entry point: a full five-team run behind the SQLite
    checkpointer, keyed by thread_id so a crashed process can resume from its
    last checkpoint instead of re-running completed teams (CLAUDE.md rule 4)."""
    async with get_checkpointer() as checkpointer:
        graph = build_orchestrator_graph(checkpointer=checkpointer)
        config = {"configurable": {"thread_id": thread_id or str(uuid.uuid4())}}
        result = await graph.ainvoke(RunState(raw_idea=raw_idea), config=config)
        return result["final_report"]
