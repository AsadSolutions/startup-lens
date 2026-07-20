import pytest
from pydantic import ValidationError

from app.models import (
    Analysis,
    IdeaSpec,
    ResearchFinding,
    ResearchFindings,
    SourceRef,
    TeamBrief,
    TeamFailure,
    TeamName,
    TeamReport,
)


def test_idea_spec_requires_idea_text():
    with pytest.raises(ValidationError):
        IdeaSpec()


def test_idea_spec_defaults_are_optional():
    idea = IdeaSpec(idea="A marketplace for vintage synths")
    assert idea.industry is None
    assert idea.geography is None


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


def test_analysis_requires_team():
    with pytest.raises(ValidationError):
        Analysis(key_insights=[], risks=[])
