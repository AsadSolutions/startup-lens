from collections.abc import AsyncIterable

from fastapi import APIRouter
from fastapi.sse import EventSourceResponse, ServerSentEvent
from pydantic import BaseModel, field_validator

from app.graph.orchestrator import intake, planner, reject_if_blank
from app.graph.team import run_team_streaming
from app.models import (
    AgentUpdateEvent,
    NodeName,
    ReportReadyEvent,
    TeamCompletedEvent,
    TeamStartedEvent,
)

router = APIRouter()


class ValidateRequest(BaseModel):
    idea: str
    industry: str | None = None
    geography: str | None = None

    @field_validator("idea")
    @classmethod
    def idea_must_not_be_blank(cls, v: str) -> str:
        return reject_if_blank(v)


@router.post("/api/validate", response_class=EventSourceResponse)
async def validate(request: ValidateRequest) -> AsyncIterable[ServerSentEvent]:
    idea = intake(request.idea, request.industry, request.geography)
    brief = await planner(idea)

    yield ServerSentEvent(
        data=TeamStartedEvent(team=brief.team).model_dump_json(),
        event="team_started",
    )

    report = None
    async for node_name, node_output in run_team_streaming(brief):
        yield ServerSentEvent(
            data=AgentUpdateEvent(
                team=brief.team,
                agent=node_name,
                message=f"{node_name} completed",
            ).model_dump_json(),
            event="agent_update",
        )
        if node_name == NodeName.WRITER:
            report = node_output["report"]

    yield ServerSentEvent(
        data=TeamCompletedEvent(team=brief.team, report=report).model_dump_json(),
        event="team_completed",
    )
    yield ServerSentEvent(
        data=ReportReadyEvent(report=report).model_dump_json(),
        event="report_ready",
    )
