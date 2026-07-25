import { TEAM_NAMES, type RunTrace } from "@/lib/types";

function formatWallClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function cleanTeamCount(trace: RunTrace): number {
  return trace.steps.filter((step) => {
    if (!step.node.startsWith("team:")) return false;
    return step.status === "ok" && !step.detail;
  }).length;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-eyebrow uppercase tracking-eyebrow text-muted">
        {label}
      </span>
      <span className="text-body font-medium text-text">{value}</span>
    </div>
  );
}

export function TraceSummary({ trace }: { trace: RunTrace }) {
  const clean = cleanTeamCount(trace);
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3">
      <Stat
        label="Wall clock"
        value={formatWallClock(trace.total_duration_ms)}
      />
      <Stat
        label="Token spend"
        value={`${trace.total_spend.toLocaleString()} tok`}
      />
      <Stat label="Teams clean" value={`${clean} / ${TEAM_NAMES.length}`} />
    </div>
  );
}
