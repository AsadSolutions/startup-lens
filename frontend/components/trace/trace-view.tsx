"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { TraceSkeleton } from "@/components/trace/trace-skeleton";
import { TraceSummary } from "@/components/trace/trace-summary";
import { TraceTimeline } from "@/components/trace/trace-timeline";
import { getRunTrace } from "@/lib/api";
import type { RunTrace } from "@/lib/types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; trace: RunTrace };

export function TraceView({ runId }: { runId: string }) {
  const [loadedRunId, setLoadedRunId] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  if (loadedRunId !== runId) {
    setLoadedRunId(runId);
    setState({ status: "loading" });
  }

  useEffect(() => {
    let active = true;
    getRunTrace(runId)
      .then((trace) => {
        if (active) setState({ status: "loaded", trace });
      })
      .catch((err) => {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "The trace could not be loaded.";
        setState({ status: "error", message });
      });
    return () => {
      active = false;
    };
  }, [runId]);

  if (state.status === "loading") {
    return (
      <main className="flex min-h-screen flex-col">
        <Navbar />
        <TraceSkeleton />
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="flex min-h-screen flex-col">
        <Navbar />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-6 text-center font-mono">
          <p className="text-section font-semibold text-text">
            This trace could not be found.
          </p>
          <p className="text-body text-muted">{state.message}</p>
          <Link href="/" className="text-caption font-medium text-accent">
            Back to StartupLens
          </Link>
        </div>
      </main>
    );
  }

  const { trace } = state;

  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />
      <header className="border-b border-border bg-bg px-6 py-6 font-mono">
        <div className="mx-auto w-full max-w-[780px]">
          <TraceSummary trace={trace} />
        </div>
      </header>
      <div className="mx-auto w-full max-w-[780px] flex-1 px-6 py-10 font-mono">
        <TraceTimeline trace={trace} />
      </div>
    </main>
  );
}
