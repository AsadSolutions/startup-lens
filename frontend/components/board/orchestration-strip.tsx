import { cn } from "@/lib/utils";
import { TEAM_NAMES, type RunState, type TeamStatus } from "@/lib/types";

type StageKey = "intake" | "planner" | "fan_out" | "fan_in" | "composer";

const STAGES: { key: StageKey; label: string }[] = [
  { key: "intake", label: "Intake" },
  { key: "planner", label: "Planner" },
  { key: "fan_out", label: "Fan out" },
  { key: "fan_in", label: "Fan in" },
  { key: "composer", label: "Composer" },
];

const TEAM_DOT_COLOR: Record<TeamStatus, string> = {
  queued: "bg-muted",
  researching: "bg-accent",
  analyzing: "bg-accent",
  writing: "bg-accent",
  done: "bg-ok",
  truncated: "bg-warn",
  failed: "bg-danger",
};

const TERMINAL: TeamStatus[] = ["done", "truncated", "failed"];

function currentStageIndex(run: RunState): number {
  const teams = TEAM_NAMES.map((t) => run.teams[t]);
  const anyStarted = teams.some((t) => t.status !== "queued");
  if (!anyStarted) return 1;
  const allTerminal = teams.every((t) => TERMINAL.includes(t.status));
  if (!allTerminal) return 2;
  return 4;
}

export function OrchestrationStrip({ run }: { run: RunState }) {
  const allComplete = Boolean(run.final_report);
  const activeIndex = currentStageIndex(run);
  const teams = TEAM_NAMES.map((t) => run.teams[t]);

  return (
    <div className="border-b border-border bg-bg px-6 py-3">
      <div className="mx-auto flex w-full max-w-[1200px] items-start">
        {STAGES.map((stage, index) => {
          const status: "ok" | "active" | "danger" | "muted" = allComplete
            ? "ok"
            : index < activeIndex
              ? "ok"
              : index === activeIndex
                ? run.status === "error"
                  ? "danger"
                  : "active"
                : "muted";

          return (
            <div
              key={stage.key}
              className="flex flex-1 items-center last:flex-none"
            >
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    status === "ok" && "bg-ok",
                    status === "active" && "bg-accent",
                    status === "danger" && "bg-danger",
                    status === "muted" && "bg-muted",
                  )}
                />
                <span
                  className={cn(
                    "whitespace-nowrap text-eyebrow uppercase tracking-eyebrow",
                    status === "ok" && "text-ok",
                    status === "active" && "text-accent",
                    status === "danger" && "text-danger",
                    status === "muted" && "text-muted",
                  )}
                >
                  {stage.label}
                </span>
                {stage.key === "fan_out" && (
                  <div className="flex gap-1" aria-hidden="true">
                    {teams.map((team) => (
                      <span
                        key={team.team}
                        className={cn(
                          "h-1 w-1 rounded-full",
                          TEAM_DOT_COLOR[team.status],
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
              {index < STAGES.length - 1 && (
                <span
                  className={cn(
                    "mx-2 h-px flex-1",
                    index < activeIndex || allComplete ? "bg-ok" : "bg-border",
                  )}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
