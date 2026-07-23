import { cn } from "@/lib/utils";

export type TeamState =
  | "queued"
  | "researching"
  | "analyzing"
  | "writing"
  | "done"
  | "truncated"
  | "failed";

const stateConfig: Record<TeamState, { label: string; dot: string; text: string }> = {
  queued: { label: "Queued", dot: "bg-muted", text: "text-muted" },
  researching: { label: "Researching", dot: "bg-accent", text: "text-accent" },
  analyzing: { label: "Analyzing", dot: "bg-accent", text: "text-accent" },
  writing: { label: "Writing", dot: "bg-accent", text: "text-accent" },
  done: { label: "Done", dot: "bg-ok", text: "text-ok" },
  truncated: { label: "Truncated", dot: "bg-warn", text: "text-warn" },
  failed: { label: "Failed", dot: "bg-danger", text: "text-danger" },
};

export interface StateChipProps {
  state: TeamState;
  className?: string;
}

export function StateChip({ state, className }: StateChipProps) {
  const config = stateConfig[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-control border border-border bg-surface-2 px-2 py-1 text-caption font-medium transition-colors duration-150 ease-out",
        config.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full transition-colors duration-150 ease-out", config.dot)} />
      {config.label}
    </span>
  );
}
