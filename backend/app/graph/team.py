from typing import AsyncIterator

from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel

from app.graph.llm import llm_for_role, structured_call
from app.mcp.client import web_search
from app.models import Analysis, NodeName, ResearchFindings, TeamBrief, TeamReport


class TeamState(BaseModel):
    brief: TeamBrief
    findings: ResearchFindings | None = None
    analysis: Analysis | None = None
    report: TeamReport | None = None


async def researcher_node(brief: TeamBrief) -> ResearchFindings:
    query = f"{brief.focus} {' '.join(brief.key_questions)}"
    raw_results = await web_search(query)
    prompt = (
        f"Team: {brief.team}\nFocus: {brief.focus}\n"
        f"Key questions: {brief.key_questions}\n\n"
        f"Raw web search results (JSON):\n{raw_results}\n\n"
        "Extract the relevant findings as ResearchFindings: for each finding, "
        "a one sentence summary, the source (title/url), and a short snippet."
    )
    return await structured_call(llm_for_role("researcher"), ResearchFindings, prompt)


async def analyst_node(brief: TeamBrief, findings: ResearchFindings) -> Analysis:
    prompt = (
        f"Team: {brief.team}\nFocus: {brief.focus}\n\n"
        f"Research findings:\n{findings.model_dump_json(indent=2)}\n\n"
        "Analyze these findings: produce key_insights and risks."
    )
    return await structured_call(llm_for_role("analyst"), Analysis, prompt)


async def writer_node(
    brief: TeamBrief, findings: ResearchFindings, analysis: Analysis
) -> TeamReport:
    sources = [f.source.model_dump() for f in findings.findings]
    prompt = (
        f"Team: {brief.team}\n\n"
        f"Analysis:\n{analysis.model_dump_json(indent=2)}\n\n"
        f"Available sources:\n{sources}\n\n"
        "Write the final TeamReport: summary, key_insights, risks, sources "
        "(reuse the available sources), truncated=false."
    )
    return await structured_call(llm_for_role("writer"), TeamReport, prompt)


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


async def run_team_streaming(
    brief: TeamBrief,
) -> AsyncIterator[tuple[str, dict]]:
    async for update in _team_graph.astream(
        TeamState(brief=brief), stream_mode="updates"
    ):
        for node_name, node_output in update.items():
            yield node_name, node_output
