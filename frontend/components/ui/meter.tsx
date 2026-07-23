import { cn } from "@/lib/utils";

export interface MeterProps {
  value: number;
  max?: number;
  label?: string;
  warnThreshold?: number;
  className?: string;
}

export function Meter({
  value,
  max = 100,
  label,
  warnThreshold = 0.8,
  className,
}: MeterProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const isWarn = pct / 100 > warnThreshold;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-control bg-surface-2"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-control transition-[width] duration-150 ease-out",
            isWarn ? "bg-warn" : "bg-accent",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="whitespace-nowrap text-mono text-muted">
        {label ?? `${Math.round(pct)}%`}
      </span>
    </div>
  );
}
