from datetime import date
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class TeamName(StrEnum):
    MARKET_RESEARCH = "market_research"
    COMPETITOR_ANALYSIS = "competitor_analysis"
    INVESTMENT_LANDSCAPE = "investment_landscape"
    MOAT_SCORING = "moat_scoring"
    GTM_STRATEGY = "gtm_strategy"


class NodeName(StrEnum):
    """The team subgraph's node names — the single source of truth shared by
    graph registration (team.py), the SSE event schema (below), and the SSE
    router's node dispatch (routers/validate.py), so the three never drift."""

    RESEARCHER = "researcher"
    ANALYST = "analyst"
    WRITER = "writer"


class IdeaSpec(BaseModel):
    idea: str


class SourceRef(BaseModel):
    title: str
    url: str | None = None
    published: date | None = None


class TeamBrief(BaseModel):
    team: TeamName
    focus: str
    key_questions: list[str]


class TeamBriefSet(BaseModel):
    briefs: list[TeamBrief]

    @model_validator(mode="after")
    def _exactly_one_brief_per_team(self) -> "TeamBriefSet":
        teams = [b.team for b in self.briefs]
        if set(teams) != set(TeamName) or len(teams) != len(TeamName):
            raise ValueError(
                f"expected exactly one TeamBrief per team, got teams={teams}"
            )
        return self


class ResearchFinding(BaseModel):
    summary: str
    source: SourceRef
    snippet: str


class ResearchFindings(BaseModel):
    team: TeamName
    findings: list[ResearchFinding]


class Analysis(BaseModel):
    team: TeamName
    key_insights: list[str]
    risks: list[str]


class TeamReport(BaseModel):
    team: TeamName
    summary: str
    key_insights: list[str]
    risks: list[str]
    sources: list[SourceRef]
    truncated: bool = False


class TeamFailure(BaseModel):
    team: TeamName
    error: str


class Contradiction(BaseModel):
    teams: list[TeamName]
    description: str


class ComposerSynthesis(BaseModel):
    executive_summary: str
    contradictions: list[Contradiction] = Field(default_factory=list)


class FinalReport(BaseModel):
    idea: IdeaSpec
    executive_summary: str
    team_reports: list[TeamReport]
    team_failures: list[TeamFailure] = Field(default_factory=list)
    contradictions: list[Contradiction] = Field(default_factory=list)


class SSEEventType(StrEnum):
    TEAM_STARTED = "team_started"
    AGENT_UPDATE = "agent_update"
    TEAM_COMPLETED = "team_completed"
    REPORT_READY = "report_ready"


class TeamStartedEvent(BaseModel):
    type: Literal[SSEEventType.TEAM_STARTED] = SSEEventType.TEAM_STARTED
    team: TeamName


class AgentUpdateEvent(BaseModel):
    type: Literal[SSEEventType.AGENT_UPDATE] = SSEEventType.AGENT_UPDATE
    team: TeamName
    agent: NodeName
    message: str


class TeamCompletedEvent(BaseModel):
    type: Literal[SSEEventType.TEAM_COMPLETED] = SSEEventType.TEAM_COMPLETED
    team: TeamName
    report: TeamReport | None = None
    failure: TeamFailure | None = None


class ReportReadyEvent(BaseModel):
    # In Phase 1, ReportReadyEvent.report is typed as TeamReport because there is no composer
    # yet (single team validation, no FinalReport merge). Phase 2 changes this to FinalReport
    # once the orchestrator node exists and merges all team reports.
    type: Literal[SSEEventType.REPORT_READY] = SSEEventType.REPORT_READY
    report: TeamReport
