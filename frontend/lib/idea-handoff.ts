import type { IdeaSpec } from "./types";

/**
 * `validateIdea` needs the idea text, but the landing page generates a
 * `runId` and navigates before any API call happens. This round-trips the
 * `IdeaSpec` through sessionStorage so `/run/[runId]` can pick it up.
 *
 * Deliberately does not delete the key after reading: React Strict Mode
 * double-invokes effects in dev, so a read-then-delete would wipe the entry
 * before the second (real) mount reads it. Leaving it behind is harmless.
 */
function storageKey(runId: string): string {
  return `startuplens-idea-${runId}`;
}

export function writeStoredIdea(runId: string, idea: IdeaSpec): void {
  window.sessionStorage.setItem(storageKey(runId), JSON.stringify(idea));
}

export function readStoredIdea(runId: string): IdeaSpec | null {
  const raw = window.sessionStorage.getItem(storageKey(runId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as IdeaSpec;
  } catch {
    return null;
  }
}
