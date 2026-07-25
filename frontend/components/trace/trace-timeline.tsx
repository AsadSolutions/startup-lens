import type { ReactNode } from "react";
import {
  TEAM_LABELS,
  type RunTrace,
  type TeamName,
  type TraceStep,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type Tone = "clean" | "warn" | "danger";

const DOT_COLOR: Record<Tone, string> = {
  clean: "bg-ok",
  warn: "bg-warn",
  danger: "bg-danger",
};

const DETAIL_COLOR: Record<Tone, string> = {
  clean: "text-muted",
  warn: "text-warn",
  danger: "text-danger",
};

function stepTone(step: TraceStep): Tone {
  if (step.status === "failed") return "danger";
  if (step.detail) return "warn";
  return "clean";
}

function worstTone(tones: Tone[]): Tone {
  if (tones.includes("danger")) return "danger";
  if (tones.includes("warn")) return "warn";
  return "clean";
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function teamFromNode(node: TraceStep["node"]): TeamName | null {
  return node.startsWith("team:") ? (node.slice(5) as TeamName) : null;
}

function RailRow({
  tone,
  isLast,
  children,
}: {
  tone: Tone;
  isLast: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
            DOT_COLOR[tone],
          )}
        />
        {!isLast && <span className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div className={cn(!isLast && "pb-8")}>{children}</div>
    </>
  );
}

function StepRow({ label, step }: { label: string; step: TraceStep }) {
  const tone = stepTone(step);
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <span className="font-medium text-text">{label}</span>
      <span className="flex items-baseline gap-3 text-muted">
        <span>{formatDuration(step.duration_ms)}</span>
        <span>{step.token_spend.toLocaleString()} tok</span>
      </span>
      {step.detail && (
        <p className={cn("w-full text-caption", DETAIL_COLOR[tone])}>
          {step.detail}
        </p>
      )}
    </div>
  );
}

export function TraceTimeline({ trace }: { trace: RunTrace }) {
  const intake = trace.steps.find((s) => s.node === "intake");
  const planner = trace.steps.find((s) => s.node === "planner");
  const fanIn = trace.steps.find((s) => s.node === "fan_in");
  const composer = trace.steps.find((s) => s.node === "composer");
  const teamSteps = trace.steps.filter((s) => teamFromNode(s.node) !== null);

  const rows: { key: string; tone: Tone; content: ReactNode }[] = [];

  if (intake) {
    rows.push({
      key: "intake",
      tone: stepTone(intake),
      content: <StepRow label="Intake" step={intake} />,
    });
  }
  if (planner) {
    rows.push({
      key: "planner",
      tone: stepTone(planner),
      content: <StepRow label="Planner" step={planner} />,
    });
  }

  if (teamSteps.length > 0) {
    rows.push({
      key: "fan_out",
      tone: worstTone(teamSteps.map(stepTone)),
      content: (
        <div>
          <p className="text-eyebrow uppercase tracking-eyebrow text-muted">
            Fan out — {teamSteps.length} parallel branches
          </p>
          <div className="mt-4 grid grid-cols-[1.25rem_1fr] gap-x-4 pl-2">
            {teamSteps.map((step, index) => {
              const team = teamFromNode(step.node);
              const label = team ? TEAM_LABELS[team] : step.node;
              return (
                <RailRow
                  key={step.node}
                  tone={stepTone(step)}
                  isLast={index === teamSteps.length - 1}
                >
                  <StepRow label={label} step={step} />
                </RailRow>
              );
            })}
          </div>
        </div>
      ),
    });
  }

  if (fanIn) {
    rows.push({
      key: "fan_in",
      tone: stepTone(fanIn),
      content: <StepRow label="Fan in" step={fanIn} />,
    });
  }
  if (composer) {
    rows.push({
      key: "composer",
      tone: stepTone(composer),
      content: <StepRow label="Composer" step={composer} />,
    });
  }

  return (
    <div className="grid grid-cols-[1.25rem_1fr] gap-x-4">
      {rows.map((row, index) => (
        <RailRow
          key={row.key}
          tone={row.tone}
          isLast={index === rows.length - 1}
        >
          {row.content}
        </RailRow>
      ))}
    </div>
  );
}
