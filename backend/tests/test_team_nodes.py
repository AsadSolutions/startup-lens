from datetime import date

from app.graph.team import analyst_node, researcher_node, run_team, writer_node
from app.models import (
    Analysis,
    ResearchFinding,
    ResearchFindings,
    SourceRef,
    TeamBrief,
    TeamFailure,
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

    async def fake_retrieve(query: str, hop: int) -> list[ResearchFinding]:
        return []

    result = await researcher_node(
        BRIEF, search=fake_search, retrieve=fake_retrieve, call_llm=fake_call_llm
    )

    assert result == fake_findings
    assert seen["schema"] is ResearchFindings
    assert "Size the vintage synth resale market" in seen["query"]
    assert "Report" in seen["prompt"]


async def test_researcher_node_fuses_web_search_and_rag_retrieval_into_the_prompt():
    rag_hit = ResearchFinding(
        summary="Curated market note",
        source=SourceRef(title="Curated Source", published=date(2024, 1, 1)),
        snippet="From the curated knowledge base.",
    )
    seen_hop = {}

    async def fake_search(query: str) -> list[dict]:
        return [{"title": "Web Result", "url": "https://example.com", "content": "..."}]

    async def fake_retrieve(query: str, hop: int) -> list[ResearchFinding]:
        seen_hop["hop"] = hop
        return [rag_hit]

    seen_prompt = {}

    async def fake_call_llm(schema, prompt):
        seen_prompt["prompt"] = prompt
        return ResearchFindings(team=BRIEF.team, findings=[])

    await researcher_node(
        BRIEF, search=fake_search, retrieve=fake_retrieve, call_llm=fake_call_llm
    )

    assert seen_hop["hop"] == 1
    assert "Web Result" in seen_prompt["prompt"]
    assert "Curated Source" in seen_prompt["prompt"]


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


def _findings_with_one_hit() -> ResearchFindings:
    return ResearchFindings(
        team=TeamName.MARKET_RESEARCH,
        findings=[
            ResearchFinding(summary="Market is growing", source=SourceRef(title="Report"), snippet="...")
        ],
    )


async def test_analyst_node_issues_a_follow_up_retrieval_when_the_llm_requests_one():
    call_count = {"n": 0}
    retrieve_calls = []

    async def call_llm(schema, prompt):
        call_count["n"] += 1
        if call_count["n"] == 1:
            return Analysis(
                team=TeamName.MARKET_RESEARCH,
                key_insights=["i1"],
                risks=["r1"],
                follow_up_query="Acme Corp funding history",
            )
        return Analysis(team=TeamName.MARKET_RESEARCH, key_insights=["i2"], risks=["r2"])

    async def fake_retrieve(query: str, hop: int):
        retrieve_calls.append((query, hop))
        return []

    result = await analyst_node(
        BRIEF, _findings_with_one_hit(), call_llm=call_llm, retrieve=fake_retrieve
    )

    assert retrieve_calls == [("Acme Corp funding history", 2)]
    assert call_count["n"] == 2
    assert result.key_insights == ["i2"]


async def test_analyst_node_stops_at_the_hop_cap_even_if_the_llm_keeps_asking():
    retrieve_calls = []

    async def call_llm(schema, prompt):
        return Analysis(
            team=TeamName.MARKET_RESEARCH,
            key_insights=["i"],
            risks=["r"],
            follow_up_query="give me one more hop please",
        )

    async def fake_retrieve(query: str, hop: int):
        retrieve_calls.append((query, hop))
        return []

    result = await analyst_node(
        BRIEF,
        _findings_with_one_hit(),
        call_llm=call_llm,
        retrieve=fake_retrieve,
        max_hops=3,
    )

    assert retrieve_calls == [("give me one more hop please", 2), ("give me one more hop please", 3)]
    assert isinstance(result, Analysis)


async def test_analyst_node_runs_the_sandbox_when_calculation_expression_is_set():
    async def call_llm(schema, prompt):
        return Analysis(
            team=TeamName.MARKET_RESEARCH,
            key_insights=["i"],
            risks=["r"],
            calculation_expression="2 + 2",
        )

    seen_expression = {}

    async def fake_calculate(expression: str) -> dict:
        seen_expression["expression"] = expression
        return {"status": "ok", "result": 4}

    result = await analyst_node(
        BRIEF, _findings_with_one_hit(), call_llm=call_llm, calculate=fake_calculate
    )

    assert seen_expression["expression"] == "2 + 2"
    assert result.calculation_result == "4"


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


async def _fake_search(query: str) -> list[dict]:
    return [{"title": "Report", "url": "https://example.com", "content": "..."}]


async def _fake_retrieve(query: str, hop: int) -> list[ResearchFinding]:
    return []


def _fake_call_llm_all_steps():
    async def call_llm(schema, prompt):
        if schema is ResearchFindings:
            return ResearchFindings(
                team=BRIEF.team,
                findings=[
                    ResearchFinding(
                        summary="Market is growing",
                        source=SourceRef(title="Report", url="https://example.com"),
                        snippet="...",
                    )
                ],
            )
        if schema is Analysis:
            return Analysis(
                team=BRIEF.team, key_insights=["Demand is rising"], risks=["Niche"]
            )
        if schema is TeamReport:
            return TeamReport(
                team=BRIEF.team,
                summary="Summary",
                key_insights=["Demand is rising"],
                risks=["Niche"],
                sources=[SourceRef(title="Report", url="https://example.com")],
            )
        raise AssertionError(f"unexpected schema {schema}")

    return call_llm


async def test_run_team_returns_full_report_when_within_budget():
    result = await run_team(
        BRIEF,
        search=_fake_search,
        retrieve=_fake_retrieve,
        call_llm=_fake_call_llm_all_steps(),
        token_budget=1_000_000,
        timeout_seconds=30,
    )
    assert isinstance(result, TeamReport)
    assert result.truncated is False


async def test_run_team_truncates_and_skips_analyst_when_token_budget_exceeded():
    seen_schemas = []

    async def call_llm(schema, prompt):
        seen_schemas.append(schema)
        if schema is ResearchFindings:
            return ResearchFindings(
                team=BRIEF.team,
                findings=[
                    ResearchFinding(
                        summary="Market is growing",
                        source=SourceRef(title="Report", url="https://example.com"),
                        snippet="...",
                    )
                ],
            )
        if schema is TeamReport:
            return TeamReport(
                team=BRIEF.team,
                summary="Summary",
                key_insights=["Demand is rising"],
                risks=["Niche"],
                sources=[SourceRef(title="Report", url="https://example.com")],
                truncated=False,  # the wrapper must override this, not trust the LLM
            )
        raise AssertionError(f"unexpected schema {schema}: analyst should be skipped")

    result = await run_team(
        BRIEF,
        search=_fake_search,
        retrieve=_fake_retrieve,
        call_llm=call_llm,
        token_budget=1,  # any real findings JSON blows past this
        timeout_seconds=30,
    )

    assert isinstance(result, TeamReport)
    assert result.truncated is True
    assert Analysis not in seen_schemas


async def test_run_team_returns_team_failure_when_a_step_raises():
    async def crashing_search(query: str) -> list[dict]:
        raise RuntimeError("search API down")

    result = await run_team(
        BRIEF, search=crashing_search, retrieve=_fake_retrieve, call_llm=_fake_call_llm_all_steps()
    )

    assert isinstance(result, TeamFailure)
    assert result.team == BRIEF.team
    assert "search API down" in result.error
