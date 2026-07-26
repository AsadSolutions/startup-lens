import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models import (
    Analysis,
    ResearchFinding,
    ResearchFindings,
    SourceRef,
    TeamBrief,
    TeamName,
    TeamReport,
)


@pytest.fixture
def fake_report() -> TeamReport:
    return TeamReport(
        team=TeamName.MARKET_RESEARCH,
        summary="Summary",
        key_insights=["Insight"],
        risks=["Risk"],
        sources=[SourceRef(title="Report")],
    )


@pytest.fixture(autouse=True)
def patch_pipeline(monkeypatch, fake_report):
    async def fake_planner(idea):
        return {
            TeamName.MARKET_RESEARCH: TeamBrief(
                team=TeamName.MARKET_RESEARCH,
                focus="Focus",
                key_questions=["Q1"],
            )
        }

    async def fake_run_team_streaming(brief):
        findings = ResearchFindings(
            team=TeamName.MARKET_RESEARCH,
            findings=[
                ResearchFinding(
                    summary="s", source=SourceRef(title="t"), snippet="sn"
                )
            ],
        )
        analysis = Analysis(
            team=TeamName.MARKET_RESEARCH, key_insights=["i"], risks=["r"]
        )
        yield "researcher", {"findings": findings}
        yield "analyst", {"analysis": analysis}
        yield "writer", {"report": fake_report}

    monkeypatch.setattr("app.routers.validate.planner", fake_planner)
    monkeypatch.setattr(
        "app.routers.validate.run_team_streaming", fake_run_team_streaming
    )


def test_validate_streams_typed_events_in_order():
    client = TestClient(app)
    with client.stream(
        "POST", "/api/validate", json={"idea": "A marketplace for vintage synths"}
    ) as response:
        assert response.status_code == 200
        event_names = []
        for line in response.iter_lines():
            if line.startswith("event:"):
                event_names.append(line.split("event:", 1)[1].strip())
        assert event_names == [
            "team_started",
            "agent_update",
            "agent_update",
            "agent_update",
            "team_completed",
            "report_ready",
        ]


def test_validate_rejects_blank_idea():
    client = TestClient(app)
    response = client.post("/api/validate", json={"idea": "   "})
    assert response.status_code == 422
