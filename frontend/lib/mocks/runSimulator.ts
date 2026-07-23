import type { AgentRole, FinalReport, IdeaSpec, RunEvent, RunTrace, TeamName, TeamReport, TraceStep } from "../types";
import { TEAM_LABELS } from "../types";
import { DEMO_FINDINGS, DEMO_MOAT_BREAKDOWN, DEMO_CONTRADICTIONS, DEMO_TEAM_REPORTS } from "./data";
import { shouldFailATeam } from "./scenario";
import { cacheRun } from "./store";

const RUN_BUDGET = 50_000;

/** The team that always finishes first, with fewer steps than the rest. */
const EARLY_FINISHER: TeamName = "competitor_analysis";
/** The team that always hits its token budget and ships truncated. */
const TRUNCATED_TEAM: TeamName = "investment_landscape";
/** The team that fails, but only when `?scenario=fail` is set. Never the
 * MOAT team, so the MOAT breakdown section is always renderable. */
const FAILABLE_TEAM: TeamName = "gtm_strategy";

type Outcome = "done" | "truncated" | "failed";

interface TeamProfile {
  team: TeamName;
  outcome: Outcome;
  teamStartedAt: number;
  researcherAt: number;
  findings: { at: number; index: number; spend: number }[];
  analystAt: number;
  analystSpend: number;
  writerAt: number;
  writerSpend: number;
  settledAt: number; // team_completed / team_failed fires here
  finalSpend: number;
  failureMessage?: string;
}

function buildProfiles(failing: boolean): TeamProfile[] {
  return [
    {
      team: EARLY_FINISHER,
      outcome: "done",
      teamStartedAt: 400,
      researcherAt: 500,
      findings: [
        { at: 1200, index: 0, spend: 2800 },
        { at: 2200, index: 1, spend: 4300 },
      ],
      analystAt: 3000,
      analystSpend: 5300,
      writerAt: 4200,
      writerSpend: 5800,
      settledAt: 5200,
      finalSpend: 6100,
    },
    {
      team: "market_research",
      outcome: "done",
      teamStartedAt: 800,
      researcherAt: 900,
      findings: [
        { at: 1800, index: 0, spend: 3400 },
        { at: 3000, index: 1, spend: 5600 },
        { at: 4200, index: 2, spend: 7200 },
      ],
      analystAt: 5000,
      analystSpend: 8300,
      writerAt: 7500,
      writerSpend: 9000,
      settledAt: 9200,
      finalSpend: 9400,
    },
    {
      team: FAILABLE_TEAM,
      outcome: failing ? "failed" : "done",
      teamStartedAt: 1200,
      researcherAt: 1300,
      findings: failing
        ? [
            { at: 2400, index: 0, spend: 3200 },
            { at: 3800, index: 1, spend: 5000 },
          ]
        : [
            { at: 2400, index: 0, spend: 3200 },
            { at: 3800, index: 1, spend: 5000 },
            { at: 5400, index: 2, spend: 6800 },
          ],
      analystAt: 6200,
      analystSpend: failing ? 6700 : 7600,
      writerAt: failing ? 6200 : 8600,
      writerSpend: failing ? 6700 : 8000,
      settledAt: failing ? 6700 : 10400,
      finalSpend: failing ? 6700 : 8000,
      failureMessage: "The analyst crashed reasoning over channel data. The run continues without this team.",
    },
    {
      team: "moat_scoring",
      outcome: "done",
      teamStartedAt: 1600,
      researcherAt: 1700,
      findings: [
        { at: 2800, index: 0, spend: 3300 },
        { at: 4600, index: 1, spend: 5200 },
        { at: 6300, index: 2, spend: 6600 },
      ],
      analystAt: 7200,
      analystSpend: 7000,
      writerAt: 9600,
      writerSpend: 7200,
      settledAt: 11200,
      finalSpend: 7300,
    },
    {
      team: TRUNCATED_TEAM,
      outcome: "truncated",
      teamStartedAt: 2000,
      researcherAt: 2100,
      findings: [
        { at: 3200, index: 0, spend: 3000 },
        { at: 5200, index: 1, spend: 4900 },
      ],
      analystAt: 6200,
      analystSpend: 6500,
      writerAt: 7600,
      writerSpend: 7900,
      settledAt: 8000,
      finalSpend: 8000,
      failureMessage: "Hit its token budget. Wrapping up with what it has.",
    },
  ];
}

const AGENT_MESSAGE: Record<AgentRole, (teamLabel: string) => string> = {
  researcher: (label) => `Researching ${label.toLowerCase()}...`,
  analyst: () => "Analyzing findings and checking sources...",
  writer: (label) => `Drafting the ${label} section...`,
};

interface Cue {
  at: number;
  events: RunEvent[];
}

function buildTimeline(runId: string, idea: IdeaSpec, failing: boolean): { cues: Cue[]; profiles: TeamProfile[] } {
  const profiles = buildProfiles(failing);
  const cues: Cue[] = [
    { at: 0, events: [{ type: "run_started", run_id: runId, idea, budget: RUN_BUDGET }] },
  ];

  for (const profile of profiles) {
    const label = TEAM_LABELS[profile.team];

    cues.push({ at: profile.teamStartedAt, events: [{ type: "team_started", run_id: runId, team: profile.team }] });

    cues.push({
      at: profile.researcherAt,
      events: [
        { type: "agent_update", run_id: runId, team: profile.team, agent: "researcher", message: AGENT_MESSAGE.researcher(label) },
      ],
    });

    for (const f of profile.findings) {
      const finding = DEMO_FINDINGS[profile.team][f.index];
      cues.push({
        at: f.at,
        events: [
          { type: "finding", run_id: runId, team: profile.team, finding },
          { type: "spend_update", run_id: runId, team: profile.team, spend: f.spend },
        ],
      });
    }

    if (profile.outcome === "failed") {
      cues.push({
        at: profile.analystAt,
        events: [
          { type: "agent_update", run_id: runId, team: profile.team, agent: "analyst", message: AGENT_MESSAGE.analyst(label) },
          { type: "spend_update", run_id: runId, team: profile.team, spend: profile.analystSpend },
        ],
      });
      cues.push({
        at: profile.settledAt,
        events: [
          {
            type: "team_failed",
            run_id: runId,
            team: profile.team,
            failure: { team: profile.team, error: profile.failureMessage ?? "The team crashed." },
          },
        ],
      });
      continue;
    }

    const analystMessage =
      profile.outcome === "truncated"
        ? profile.failureMessage ?? AGENT_MESSAGE.analyst(label)
        : AGENT_MESSAGE.analyst(label);

    cues.push({
      at: profile.analystAt,
      events: [
        { type: "agent_update", run_id: runId, team: profile.team, agent: "analyst", message: analystMessage },
        { type: "spend_update", run_id: runId, team: profile.team, spend: profile.analystSpend },
      ],
    });

    cues.push({
      at: profile.writerAt,
      events: [
        { type: "agent_update", run_id: runId, team: profile.team, agent: "writer", message: AGENT_MESSAGE.writer(label) },
        { type: "spend_update", run_id: runId, team: profile.team, spend: profile.writerSpend },
      ],
    });

    const report: TeamReport = {
      ...DEMO_TEAM_REPORTS[profile.team],
      truncated: profile.outcome === "truncated",
      spend: profile.finalSpend,
    };

    cues.push({
      at: profile.settledAt,
      events: [
        { type: "team_completed", run_id: runId, team: profile.team, report },
        { type: "spend_update", run_id: runId, team: profile.team, spend: profile.finalSpend },
      ],
    });
  }

  return { cues: cues.sort((a, b) => a.at - b.at), profiles };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildLiveTrace(runId: string, runStart: number, profiles: TeamProfile[]): RunTrace {
  const steps: TraceStep[] = [
    { node: "intake", status: "ok", started_at: new Date(runStart).toISOString(), duration_ms: 150, token_spend: 0, detail: null },
    {
      node: "planner",
      status: "ok",
      started_at: new Date(runStart + 150).toISOString(),
      duration_ms: 250,
      token_spend: 350,
      detail: null,
    },
  ];

  for (const p of profiles) {
    steps.push({
      node: `team:${p.team}`,
      status: p.outcome === "failed" ? "failed" : "ok",
      started_at: new Date(runStart + p.teamStartedAt).toISOString(),
      duration_ms: p.settledAt - p.teamStartedAt,
      token_spend: p.finalSpend,
      detail: p.outcome === "done" ? null : p.failureMessage ?? null,
    });
  }

  const maxSettled = Math.max(...profiles.map((p) => p.settledAt));
  steps.push({
    node: "fan_in",
    status: "ok",
    started_at: new Date(runStart + maxSettled).toISOString(),
    duration_ms: 100,
    token_spend: 0,
    detail: null,
  });
  steps.push({
    node: "composer",
    status: "ok",
    started_at: new Date(runStart + maxSettled + 100).toISOString(),
    duration_ms: 1200,
    token_spend: 800,
    detail: null,
  });

  const totalSpend = steps.reduce((sum, s) => sum + s.token_spend, 0);
  return {
    run_id: runId,
    steps,
    total_duration_ms: maxSettled + 100 + 1200,
    total_spend: totalSpend,
  };
}

export async function* simulateRun(idea: IdeaSpec): AsyncGenerator<RunEvent> {
  const runId = `mock-${Math.random().toString(36).slice(2, 10)}`;
  const runStart = Date.now();
  const failing = shouldFailATeam();
  const { cues, profiles } = buildTimeline(runId, idea, failing);

  let elapsed = 0;
  let runningTotal = 0;
  const lastKnownSpend = new Map<TeamName, number>();

  for (const cue of cues) {
    await sleep(Math.max(0, cue.at - elapsed));
    elapsed = cue.at;

    for (const event of cue.events) {
      yield event;
      if (event.type === "spend_update" && event.team) {
        lastKnownSpend.set(event.team, event.spend);
        runningTotal = [...lastKnownSpend.values()].reduce((sum, v) => sum + v, 0);
        yield { type: "spend_update", run_id: runId, team: null, spend: runningTotal };
      }
    }
  }

  await sleep(600);

  const teamReports = profiles
    .filter((p) => p.outcome !== "failed")
    .map((p) => ({
      ...DEMO_TEAM_REPORTS[p.team],
      truncated: p.outcome === "truncated",
      spend: p.finalSpend,
    }));

  const teamFailures = profiles
    .filter((p) => p.outcome === "failed")
    .map((p) => ({ team: p.team, error: p.failureMessage ?? "The team crashed." }));

  const report: FinalReport = {
    run_id: runId,
    idea,
    executive_summary:
      teamFailures.length > 0
        ? "Four of five teams completed; Go-to-Market Strategy failed mid-run and is excluded below. The remaining research still supports a cautious read on this idea."
        : "An AI copilot that scopes and prices freelance developer projects addresses a real, growing pain point in a market with no dedicated incumbent, but defensibility is currently thin and at least one funded competitor is already accumulating the same pricing data this report treats as the long-term moat. Proceed, but plan to out-execute on distribution and data collection from day one rather than relying on a structural advantage.",
    readiness_verdict: "proceed_with_caution",
    readiness_note:
      teamFailures.length > 0
        ? "One team failed to report, so this verdict is based on four of five research tracks."
        : "Real demand and an open lane, but the moat is not yet defensible and a funded comparable already exists.",
    team_reports: teamReports,
    team_failures: teamFailures,
    moat_breakdown: DEMO_MOAT_BREAKDOWN,
    contradictions: DEMO_CONTRADICTIONS,
    generated_at: new Date().toISOString(),
  };

  const trace = buildLiveTrace(runId, runStart, profiles);
  cacheRun(runId, report, trace);

  yield { type: "report_ready", run_id: runId, report };
}
