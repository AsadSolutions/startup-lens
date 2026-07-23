import type { FinalReport, IdeaSpec, RunEvent, RunTrace } from "../types";
import { EXAMPLE_REPORTS } from "./data";
import { simulateRun } from "./runSimulator";
import { getCachedRun } from "./store";
import { buildTraceFromReport } from "./trace";

export function validateIdea(idea: IdeaSpec): AsyncGenerator<RunEvent> {
  return simulateRun(idea);
}

export async function getExampleReports(): Promise<FinalReport[]> {
  return EXAMPLE_REPORTS;
}

export async function getReport(runId: string): Promise<FinalReport> {
  const cached = getCachedRun(runId);
  if (cached) return cached.report;

  const example = EXAMPLE_REPORTS.find((r) => r.run_id === runId);
  if (example) return example;

  throw new Error(`No mock report found for run "${runId}"`);
}

export async function getRunTrace(runId: string): Promise<RunTrace> {
  const cached = getCachedRun(runId);
  if (cached) return cached.trace;

  const example = EXAMPLE_REPORTS.find((r) => r.run_id === runId);
  if (example) return buildTraceFromReport(example);

  throw new Error(`No mock trace found for run "${runId}"`);
}
