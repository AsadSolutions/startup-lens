/**
 * Single source of truth for every shape crossing the frontend/backend boundary,
 * plus the client-side shapes derived from it. Field names mirror the backend's
 */

// ---------------------------------------------------------------------------
// Team & agent identity
// ---------------------------------------------------------------------------

export type TeamName =
  | "market_research"
  | "competitor_analysis"
  | "investment_landscape"
  | "moat_scoring"
  | "gtm_strategy";

export const TEAM_NAMES: readonly TeamName[] = [
  "market_research",
  "competitor_analysis",
  "investment_landscape",
  "moat_scoring",
  "gtm_strategy",
];

export const TEAM_LABELS: Record<TeamName, string> = {
  market_research: "Market Research",
  competitor_analysis: "Competitor Analysis",
  investment_landscape: "Investment Landscape",
  moat_scoring: "MOAT Scoring",
  gtm_strategy: "GTM Strategy",
};

export type AgentRole = "researcher" | "analyst" | "writer";

export type TeamStatus =
  | "queued"
  | "researching"
  | "analyzing"
  | "writing"
  | "done"
  | "truncated"
  | "failed";

// ---------------------------------------------------------------------------
// Idea intake
// ---------------------------------------------------------------------------

export interface IdeaSpec {
  idea: string;
  industry: string | null;
  geography: string | null;
}

// ---------------------------------------------------------------------------
// Research & sourcing
// ---------------------------------------------------------------------------

export interface SourceRef {
  title: string;
  url: string | null;
  published: string | null; // ISO date, e.g. "2025-11-03"
}

export interface ResearchFinding {
  summary: string;
  source: SourceRef;
  snippet: string;
}

// ---------------------------------------------------------------------------
// Team output
// ---------------------------------------------------------------------------

export interface TeamReport {
  team: TeamName;
  summary: string;
  key_insights: string[];
  risks: string[];
  sources: SourceRef[];
  truncated: boolean;
  spend: number; // tokens spent by this team
}

export interface TeamFailure {
  team: TeamName;
  error: string;
}

// ---------------------------------------------------------------------------
// MOAT breakdown
// ---------------------------------------------------------------------------

export type MoatDimensionName =
  | "network_effects"
  | "switching_costs"
  | "technology_edge"
  | "brand"
  | "regulation";

export const MOAT_DIMENSION_NAMES: readonly MoatDimensionName[] = [
  "network_effects",
  "switching_costs",
  "technology_edge",
  "brand",
  "regulation",
];

export const MOAT_DIMENSION_LABELS: Record<MoatDimensionName, string> = {
  network_effects: "Network Effects",
  switching_costs: "Switching Costs",
  technology_edge: "Technology Edge",
  brand: "Brand",
  regulation: "Regulation",
};

export interface MoatDimension {
  dimension: MoatDimensionName;
  score: number; // 0-5 filled segments
  justification: string;
}

// ---------------------------------------------------------------------------
// Cross-team synthesis
// ---------------------------------------------------------------------------

export interface Contradiction {
  teams: [TeamName, TeamName];
  description: string;
}

export type ReadinessVerdict = "promising" | "proceed_with_caution" | "weak";

export const READINESS_VERDICT_LABELS: Record<ReadinessVerdict, string> = {
  promising: "Promising",
  proceed_with_caution: "Proceed with caution",
  weak: "Weak",
};

// ---------------------------------------------------------------------------
// Final report
// ---------------------------------------------------------------------------

export interface FinalReport {
  run_id: string;
  idea: IdeaSpec;
  executive_summary: string;
  readiness_verdict: ReadinessVerdict;
  readiness_note: string;
  team_reports: TeamReport[];
  team_failures: TeamFailure[];
  moat_breakdown: MoatDimension[];
  contradictions: Contradiction[];
  generated_at: string; // ISO datetime
}

// ---------------------------------------------------------------------------
// Client-side run state, accumulated from the SSE stream by a run hook.
// This is not the backend's internal LangGraph state — it is what the live
// board renders.
// ---------------------------------------------------------------------------

export interface TeamRunState {
  team: TeamName;
  status: TeamStatus;
  current_agent: AgentRole | null;
  findings: string[]; // most recent first; the board caps this to 3
  spend: number;
  started_at: string | null;
  completed_at: string | null;
  report: TeamReport | null;
  failure: TeamFailure | null;
}

export type RunStatus = "running" | "done" | "error";

export interface RunState {
  run_id: string;
  idea: IdeaSpec;
  started_at: string;
  status: RunStatus;
  budget: number;
  total_spend: number;
  teams: Record<TeamName, TeamRunState>;
  final_report: FinalReport | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Orchestration trace (`/trace/[runId]`)
// ---------------------------------------------------------------------------

export type TraceNode =
  | "intake"
  | "planner"
  | `team:${TeamName}`
  | "fan_in"
  | "composer";

export interface TraceStep {
  node: TraceNode;
  status: "ok" | "failed";
  started_at: string;
  duration_ms: number;
  token_spend: number;
  detail: string | null;
}

export interface RunTrace {
  run_id: string;
  steps: TraceStep[];
  total_duration_ms: number;
  total_spend: number;
}

// ---------------------------------------------------------------------------
// SSE events
// ---------------------------------------------------------------------------

interface BaseEvent {
  run_id: string;
}

export interface RunStartedEvent extends BaseEvent {
  type: "run_started";
  idea: IdeaSpec;
  budget: number;
}

export interface TeamStartedEvent extends BaseEvent {
  type: "team_started";
  team: TeamName;
}

export interface AgentUpdateEvent extends BaseEvent {
  type: "agent_update";
  team: TeamName;
  agent: AgentRole;
  message: string;
}

export interface FindingEvent extends BaseEvent {
  type: "finding";
  team: TeamName;
  finding: ResearchFinding;
}

export interface TeamCompletedEvent extends BaseEvent {
  type: "team_completed";
  team: TeamName;
  report: TeamReport;
}

export interface TeamFailedEvent extends BaseEvent {
  type: "team_failed";
  team: TeamName;
  failure: TeamFailure;
}

export interface SpendUpdateEvent extends BaseEvent {
  type: "spend_update";
  team: TeamName | null; // null = run-level total
  spend: number;
}

export interface ReportReadyEvent extends BaseEvent {
  type: "report_ready";
  report: FinalReport;
}

export interface ErrorEvent extends BaseEvent {
  type: "error";
  message: string;
}

export type RunEvent =
  | RunStartedEvent
  | TeamStartedEvent
  | AgentUpdateEvent
  | FindingEvent
  | TeamCompletedEvent
  | TeamFailedEvent
  | SpendUpdateEvent
  | ReportReadyEvent
  | ErrorEvent;
