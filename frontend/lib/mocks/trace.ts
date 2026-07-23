import type { FinalReport, RunTrace, TraceStep } from "../types";

const SYNTHETIC_TEAM_DURATION_MS = 8000;

/**
 * Reconstructs a plausible `RunTrace` for a precomputed example report, which
 * has no real cue timeline behind it. Live mock runs use `runSimulator`'s
 * more accurate cue-based trace instead.
 */
export function buildTraceFromReport(report: FinalReport): RunTrace {
  const runStart = new Date(report.generated_at).getTime() - 60_000;
  const steps: TraceStep[] = [
    { node: "intake", status: "ok", started_at: new Date(runStart).toISOString(), duration_ms: 200, token_spend: 0, detail: null },
    {
      node: "planner",
      status: "ok",
      started_at: new Date(runStart + 200).toISOString(),
      duration_ms: 900,
      token_spend: 400,
      detail: null,
    },
  ];

  const fanOutStart = runStart + 1100;
  let fanOutEnd = fanOutStart;

  for (const teamReport of report.team_reports) {
    const durationMs = teamReport.truncated ? SYNTHETIC_TEAM_DURATION_MS * 0.6 : SYNTHETIC_TEAM_DURATION_MS;
    steps.push({
      node: `team:${teamReport.team}`,
      status: "ok",
      started_at: new Date(fanOutStart).toISOString(),
      duration_ms: durationMs,
      token_spend: teamReport.spend,
      detail: teamReport.truncated ? "Hit its token budget. Wrapped up with what it had." : null,
    });
    fanOutEnd = Math.max(fanOutEnd, fanOutStart + durationMs);
  }

  for (const failure of report.team_failures) {
    const durationMs = SYNTHETIC_TEAM_DURATION_MS * 0.4;
    steps.push({
      node: `team:${failure.team}`,
      status: "failed",
      started_at: new Date(fanOutStart).toISOString(),
      duration_ms: durationMs,
      token_spend: 0,
      detail: failure.error,
    });
    fanOutEnd = Math.max(fanOutEnd, fanOutStart + durationMs);
  }

  steps.push({
    node: "fan_in",
    status: "ok",
    started_at: new Date(fanOutEnd).toISOString(),
    duration_ms: 150,
    token_spend: 0,
    detail: null,
  });
  steps.push({
    node: "composer",
    status: "ok",
    started_at: new Date(fanOutEnd + 150).toISOString(),
    duration_ms: 1600,
    token_spend: 900,
    detail: null,
  });

  const totalSpend = steps.reduce((sum, s) => sum + s.token_spend, 0);
  const totalDurationMs = fanOutEnd + 150 + 1600 - runStart;

  return { run_id: report.run_id, steps, total_duration_ms: totalDurationMs, total_spend: totalSpend };
}
