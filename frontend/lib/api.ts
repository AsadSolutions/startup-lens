import { apiBaseUrl, isMockMode } from "./config";
import * as mocks from "./mocks";
import { parseSSEStream } from "./sse";
import type { FinalReport, IdeaSpec, RunEvent, RunTrace } from "./types";

/**
 * The typed data layer. Every function here has one signature regardless of
 * `NEXT_PUBLIC_USE_MOCKS` — callers never branch on mocks, only these
 * functions do.
 */

export function validateIdea(idea: IdeaSpec): AsyncGenerator<RunEvent> {
  if (isMockMode) return mocks.validateIdea(idea);
  return validateIdeaFromBackend(idea);
}

async function* validateIdeaFromBackend(
  idea: IdeaSpec,
): AsyncGenerator<RunEvent> {
  const response = await fetch(`${apiBaseUrl}/api/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(idea),
  });

  if (!response.ok) {
    throw new Error(
      `validateIdea failed: ${response.status} ${response.statusText}`,
    );
  }

  yield* parseSSEStream(response);
}

export async function getExampleReports(): Promise<FinalReport[]> {
  if (isMockMode) return mocks.getExampleReports();

  const response = await fetch(`${apiBaseUrl}/api/reports/examples`);
  if (!response.ok) {
    throw new Error(
      `getExampleReports failed: ${response.status} ${response.statusText}`,
    );
  }
  return response.json();
}

export async function getReport(runId: string): Promise<FinalReport> {
  if (isMockMode) return mocks.getReport(runId);

  const response = await fetch(`${apiBaseUrl}/api/runs/${runId}/report`);
  if (!response.ok) {
    throw new Error(
      `getReport failed: ${response.status} ${response.statusText}`,
    );
  }
  return response.json();
}

export async function getRunTrace(runId: string): Promise<RunTrace> {
  if (isMockMode) return mocks.getRunTrace(runId);

  const response = await fetch(`${apiBaseUrl}/api/runs/${runId}/trace`);
  if (!response.ok) {
    throw new Error(
      `getRunTrace failed: ${response.status} ${response.statusText}`,
    );
  }
  return response.json();
}
