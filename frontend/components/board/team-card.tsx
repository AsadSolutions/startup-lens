import { Card } from "@/components/ui/card";
import { StateChip } from "@/components/ui/state-chip";
import { TEAM_ICONS } from "@/lib/team-meta";
import { TEAM_LABELS, type AgentRole, type TeamRunState } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS: AgentRole[] = ["researcher", "analyst", "writer"];

const STEP_LABEL: Record<AgentRole, string> = {
  researcher: "Researcher",
  analyst: "Analyst",
  writer: "Writer",
};

const TERMINAL_STATUSES: TeamRunState["status"][] = [
  "done",
  "truncated",
  "failed",
];

function stepState(
  team: TeamRunState,
  step: AgentRole,
): "done" | "active" | "pending" {
  const stepIndex = STEPS.indexOf(step);
  const currentIndex = team.current_agent
    ? STEPS.indexOf(team.current_agent)
    : -1;
  if (TERMINAL_STATUSES.includes(team.status)) return "done";
  if (stepIndex < currentIndex) return "done";
  if (stepIndex === currentIndex) return "active";
  return "pending";
}

function formatElapsed(
  startedAt: string | null,
  completedAt: string | null,
): string {
  if (!startedAt) return "--:--";
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const totalSeconds = Math.max(
    0,
    Math.floor((end - new Date(startedAt).getTime()) / 1000),
  );
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function TeamCard({ team }: { team: TeamRunState }) {
  if (team.status === "queued") {
    return (
      <Card>
        <p className="text-body font-medium text-muted">
          {TEAM_LABELS[team.team]}
        </p>
        <p className="mt-1 text-caption text-muted">queued</p>
      </Card>
    );
  }

  const Icon = TEAM_ICONS[team.team];
  const isWorking =
    team.status === "researching" ||
    team.status === "analyzing" ||
    team.status === "writing";
  const isFailed = team.status === "failed";
  const isTruncated = team.status === "truncated";

  return (
    <Card
      pulse={isWorking}
      className={cn(isFailed && "border-l-2 border-l-danger")}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <span className="truncate text-body font-medium text-text">
            {TEAM_LABELS[team.team]}
          </span>
        </div>
        <StateChip state={team.status} />
      </div>

      <div className="mt-4 flex items-center gap-2">
        {STEPS.map((step, index) => {
          const status = stepState(team, step);
          return (
            <div key={step} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "text-caption font-medium",
                  status === "done" && "text-ok",
                  status === "active" && "text-accent",
                  status === "pending" && "text-muted",
                )}
              >
                {STEP_LABEL[step]}
              </span>
              {index < STEPS.length - 1 && (
                <span
                  className={cn(
                    "h-px flex-1",
                    status === "done" ? "bg-ok" : "bg-border",
                  )}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex min-h-[4.5rem] flex-col gap-1.5">
        {isFailed ? (
          <p className="text-caption text-danger">{team.failure?.error}</p>
        ) : (
          <>
            {team.findings.map((line, index) => (
              <p
                key={line}
                className={cn(
                  "animate-fade-slide text-caption text-text transition-opacity duration-150 ease-out",
                  index === 1 && "opacity-60",
                  index === 2 && "opacity-35",
                )}
              >
                {line}
              </p>
            ))}
            {isTruncated && (
              <p className="text-caption text-warn">
                Wrapped up early on budget.
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-mono text-muted">
        <span>{formatElapsed(team.started_at, team.completed_at)}</span>
        <span>{team.spend.toLocaleString()} tok</span>
      </div>
    </Card>
  );
}
