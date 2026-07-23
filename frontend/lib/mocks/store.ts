import type { FinalReport, RunTrace } from "../types";

/**
 * Mock-only in-memory cache of runs the current session has produced via
 * `simulateRun`, so `getReport`/`getRunTrace` can look a completed mock run
 * back up by id without a real backend to persist it.
 */
interface CachedRun {
  report: FinalReport;
  trace: RunTrace;
}

const cache = new Map<string, CachedRun>();

export function cacheRun(runId: string, report: FinalReport, trace: RunTrace): void {
  cache.set(runId, { report, trace });
}

export function getCachedRun(runId: string): CachedRun | undefined {
  return cache.get(runId);
}
