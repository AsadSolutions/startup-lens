from app.graph.orchestrator import build_orchestrator_graph
from app.models import (
    Analysis,
    ComposerSynthesis,
    ResearchFinding,
    ResearchFindings,
    SourceRef,
    TeamBrief,
    TeamBriefSet,
    TeamName,
    TeamReport,
)


def _fake_brief_set() -> TeamBriefSet:
    return TeamBriefSet(
        briefs=[
            TeamBrief(team=t, focus=f"Focus for {t.value}", key_questions=["Q?"])
            for t in TeamName
        ]
    )


async def _fake_planner_call_llm(schema, prompt):
    assert schema is TeamBriefSet
    return _fake_brief_set()


def _good_team_call_llm(team: TeamName):
    async def call_llm(schema, prompt):
        if schema is ResearchFindings:
            return ResearchFindings(
                team=team,
                findings=[
                    ResearchFinding(
                        summary="s", source=SourceRef(title="t"), snippet="sn"
                    )
                ],
            )
        if schema is Analysis:
            return Analysis(team=team, key_insights=["insight"], risks=["risk"])
        if schema is TeamReport:
            return TeamReport(
                team=team,
                summary="summary",
                key_insights=["insight"],
                risks=["risk"],
                sources=[SourceRef(title="t")],
            )
        raise AssertionError(f"unexpected schema {schema}")

    return call_llm


def _crashing_team_call_llm(team: TeamName):
    async def call_llm(schema, prompt):
        raise RuntimeError(f"{team.value} researcher exploded")

    return call_llm


async def _fake_search(query: str) -> list[dict]:
    return [{"title": "t", "url": "https://example.com", "content": "..."}]


async def _fake_composer_call_llm(schema, prompt):
    assert schema is ComposerSynthesis
    return ComposerSynthesis(
        executive_summary="Four of five teams reported; one team failed."
    )


async def test_orchestrator_run_completes_with_four_reports_and_a_visible_failure_when_one_team_crashes():
    def team_call_llm_factory(team: TeamName):
        if team == TeamName.INVESTMENT_LANDSCAPE:
            return _crashing_team_call_llm(team)
        return _good_team_call_llm(team)

    graph = build_orchestrator_graph(
        planner_call_llm=_fake_planner_call_llm,
        team_call_llm_factory=team_call_llm_factory,
        team_search=_fake_search,
        composer_call_llm=_fake_composer_call_llm,
    )

    result = await graph.ainvoke({"raw_idea": "A marketplace for vintage synths"})

    final_report = result["final_report"]
    assert len(final_report.team_reports) == 4
    assert len(final_report.team_failures) == 1
    failure = final_report.team_failures[0]
    assert failure.team == TeamName.INVESTMENT_LANDSCAPE
    assert "exploded" in failure.error
    reported_teams = {r.team for r in final_report.team_reports}
    assert TeamName.INVESTMENT_LANDSCAPE not in reported_teams


async def test_orchestrator_run_truncates_a_team_that_exceeds_its_token_budget():
    from app.graph import team as team_module

    original_budget = team_module.settings.team_token_budget
    team_module.settings.team_token_budget = 1
    try:
        graph = build_orchestrator_graph(
            planner_call_llm=_fake_planner_call_llm,
            team_call_llm_factory=lambda team: _good_team_call_llm(team),
            team_search=_fake_search,
            composer_call_llm=_fake_composer_call_llm,
        )

        result = await graph.ainvoke({"raw_idea": "A marketplace for vintage synths"})

        final_report = result["final_report"]
        assert len(final_report.team_reports) == 5
        assert len(final_report.team_failures) == 0
        assert all(r.truncated for r in final_report.team_reports)
    finally:
        team_module.settings.team_token_budget = original_budget
