from app.graph.team import analyst_node, researcher_node, writer_node
from app.models import (
    Analysis,
    ResearchFinding,
    ResearchFindings,
    SourceRef,
    TeamBrief,
    TeamName,
    TeamReport,
)

BRIEF = TeamBrief(
    team=TeamName.MARKET_RESEARCH,
    focus="Size the vintage synth resale market",
    key_questions=["How big is the used gear market?"],
)


async def test_researcher_node_extracts_findings_from_search_results():
    fake_findings = ResearchFindings(
        team=TeamName.MARKET_RESEARCH,
        findings=[
            ResearchFinding(
                summary="Market is growing",
                source=SourceRef(title="Report", url="https://example.com"),
                snippet="...",
            )
        ],
    )
    seen = {}

    async def fake_search(query: str) -> list[dict]:
        seen["query"] = query
        return [{"title": "Report", "url": "https://example.com", "content": "..."}]

    async def fake_call_llm(schema, prompt):
        seen["schema"] = schema
        seen["prompt"] = prompt
        return fake_findings

    result = await researcher_node(BRIEF, search=fake_search, call_llm=fake_call_llm)

    assert result == fake_findings
    assert seen["schema"] is ResearchFindings
    assert "Size the vintage synth resale market" in seen["query"]
    assert "Report" in seen["prompt"]


async def test_analyst_node_reasons_over_findings():
    findings = ResearchFindings(
        team=TeamName.MARKET_RESEARCH,
        findings=[
            ResearchFinding(
                summary="Market is growing",
                source=SourceRef(title="Report"),
                snippet="...",
            )
        ],
    )
    fake_analysis = Analysis(
        team=TeamName.MARKET_RESEARCH,
        key_insights=["Demand is rising"],
        risks=["Niche market"],
    )
    seen = {}

    async def fake_call_llm(schema, prompt):
        seen["schema"] = schema
        seen["prompt"] = prompt
        return fake_analysis

    result = await analyst_node(BRIEF, findings, call_llm=fake_call_llm)

    assert result == fake_analysis
    assert seen["schema"] is Analysis
    assert "Market is growing" in seen["prompt"]


async def test_writer_node_produces_team_report_from_analysis_and_sources():
    findings = ResearchFindings(
        team=TeamName.MARKET_RESEARCH,
        findings=[
            ResearchFinding(
                summary="Market is growing",
                source=SourceRef(title="Report", url="https://example.com"),
                snippet="...",
            )
        ],
    )
    analysis = Analysis(
        team=TeamName.MARKET_RESEARCH,
        key_insights=["Demand is rising"],
        risks=["Niche market"],
    )
    fake_report = TeamReport(
        team=TeamName.MARKET_RESEARCH,
        summary="Summary",
        key_insights=["Demand is rising"],
        risks=["Niche market"],
        sources=[SourceRef(title="Report", url="https://example.com")],
    )
    seen = {}

    async def fake_call_llm(schema, prompt):
        seen["schema"] = schema
        seen["prompt"] = prompt
        return fake_report

    result = await writer_node(BRIEF, findings, analysis, call_llm=fake_call_llm)

    assert result == fake_report
    assert seen["schema"] is TeamReport
    assert "Demand is rising" in seen["prompt"]
