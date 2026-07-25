"use client";

import { useEffect, useState } from "react";
import { Meter } from "@/components/ui/meter";
import type { RunState } from "@/lib/types";

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function RunHeader({ run }: { run: RunState }) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const startedAt = new Date(run.started_at).getTime();

    if (run.status !== "running") {
      setElapsedMs(Date.now() - startedAt);
      return;
    }

    const tick = () => setElapsedMs(Date.now() - startedAt);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [run.started_at, run.status]);

  return (
    <header className="border-b border-border bg-bg px-6 py-4">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-medium text-text" title={run.idea.idea}>
            {run.idea.idea}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <span className="text-mono text-muted">{formatElapsed(elapsedMs)}</span>
          <Meter
            value={run.total_spend}
            max={run.budget}
            label={`${run.total_spend.toLocaleString()} / ${run.budget.toLocaleString()} tokens`}
            className="w-40 sm:w-56"
          />
        </div>
      </div>
    </header>
  );
}
