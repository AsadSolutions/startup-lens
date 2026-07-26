import pytest
from pydantic import ValidationError

from app.models import (
    AgentUpdateEvent,
    Analysis,
    ComposerSynthesis,
    Contradiction,
    FinalReport,
    IdeaSpec,
    NodeName,
    ReportReadyEvent,
    ResearchFinding,
    ResearchFindings,
    SourceRef,
    TeamBrief,
    TeamBriefSet,
    TeamCompletedEvent,
    TeamFailure,
    TeamName,
    TeamReport,
    TeamStartedEvent,
)


def test_idea_spec_requires_idea_text():
    with pytest.raises(ValidationError):
        IdeaSpec()


def test_idea_spec_has_no_separate_industry_or_geography_fields():
    idea = IdeaSpec(idea="A marketplace for vintage synths")
    assert "industry" not in IdeaSpec.model_fields
    assert "geography" not in IdeaSpec.model_fields
    assert idea.idea == "A marketplace for vintage synths"


def test_team_brief_round_trip():
    brief = TeamBrief(
        team=TeamName.MARKET_RESEARCH,
        focus="Size the vintage synth resale market",
        key_questions=["How big is the used gear market?"],
    )
    assert brief.team == "market_research"


def test_research_findings_holds_sourced_findings():
    finding = ResearchFinding(
        summary="Market is growing",
        source=SourceRef(title="Report", url="https://example.com"),
        snippet="...",
    )
    findings = ResearchFindings(team=TeamName.MARKET_RESEARCH, findings=[finding])
    assert len(findings.findings) == 1


def test_team_report_defaults_not_truncated():
    report = TeamReport(
        team=TeamName.MARKET_RESEARCH,
        summary="Summary",
        key_insights=["Insight"],
        risks=["Risk"],
        sources=[SourceRef(title="Report")],
    )
    assert report.truncated is False


def test_team_failure_requires_error():
    with pytest.raises(ValidationError):
        TeamFailure(team=TeamName.MARKET_RESEARCH)


def test_team_brief_set_requires_exactly_one_brief_per_team():
    with pytest.raises(ValidationError):
        TeamBriefSet(
            briefs=[
                TeamBrief(team=TeamName.MARKET_RESEARCH, focus="f", key_questions=["q"])
            ]
        )


def test_team_brief_set_accepts_one_brief_per_team():
    briefs = TeamBriefSet(
        briefs=[
            TeamBrief(team=t, focus="f", key_questions=["q"]) for t in TeamName
        ]
    )
    assert {b.team for b in briefs.briefs} == set(TeamName)


def test_contradiction_requires_teams_and_description():
    with pytest.raises(ValidationError):
        Contradiction(teams=[TeamName.MARKET_RESEARCH])


def test_composer_synthesis_defaults_no_contradictions():
    synthesis = ComposerSynthesis(executive_summary="Summary.")
    assert synthesis.contradictions == []


def test_analysis_requires_team():
    with pytest.raises(ValidationError):
        Analysis(key_insights=[], risks=[])


def _fake_report() -> TeamReport:
    return TeamReport(
        team=TeamName.MARKET_RESEARCH,
        summary="Summary",
        key_insights=["Insight"],
        risks=["Risk"],
        sources=[SourceRef(title="Report")],
    )


def test_final_report_defaults_no_failures():
    report = FinalReport(
        idea=IdeaSpec(idea="A marketplace for vintage synths"),
        executive_summary="Looks promising.",
        team_reports=[_fake_report()],
    )
    assert report.team_failures == []


def test_final_report_defaults_no_contradictions():
    report = FinalReport(
        idea=IdeaSpec(idea="A marketplace for vintage synths"),
        executive_summary="Looks promising.",
        team_reports=[_fake_report()],
    )
    assert report.contradictions == []


def test_final_report_holds_failures():
    failure = TeamFailure(team=TeamName.MARKET_RESEARCH, error="crashed")
    report = FinalReport(
        idea=IdeaSpec(idea="A marketplace for vintage synths"),
        executive_summary="Partial run.",
        team_reports=[],
        team_failures=[failure],
    )
    assert report.team_failures == [failure]


def test_team_started_event_carries_team():
    event = TeamStartedEvent(team=TeamName.MARKET_RESEARCH)
    assert event.type == "team_started"


def test_agent_update_event_carries_team_agent_and_message():
    event = AgentUpdateEvent(
        team=TeamName.MARKET_RESEARCH,
        agent=NodeName.RESEARCHER,
        message="researcher completed",
    )
    assert event.type == "agent_update"
    assert event.agent == NodeName.RESEARCHER


def test_team_completed_event_can_carry_a_report():
    event = TeamCompletedEvent(team=TeamName.MARKET_RESEARCH, report=_fake_report())
    assert event.type == "team_completed"
    assert event.failure is None


def test_team_completed_event_can_carry_a_failure():
    failure = TeamFailure(team=TeamName.MARKET_RESEARCH, error="crashed")
    event = TeamCompletedEvent(team=TeamName.MARKET_RESEARCH, failure=failure)
    assert event.report is None
    assert event.failure == failure


def test_report_ready_event_requires_a_report():
    with pytest.raises(ValidationError):
        ReportReadyEvent()
    event = ReportReadyEvent(report=_fake_report())
    assert event.type == "report_ready"
