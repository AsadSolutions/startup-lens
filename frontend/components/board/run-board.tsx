"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { readStoredIdea } from "@/lib/idea-handoff";
import { TEAM_NAMES, type IdeaSpec } from "@/lib/types";
import { useRunStream } from "@/lib/use-run-stream";
import { OrchestrationStrip } from "./orchestration-strip";
import { RunHeader } from "./run-header";
import { TeamCard } from "./team-card";

export function RunBoard({ runId }: { runId: string }) {
  const [ideaChecked, setIdeaChecked] = useState(false);
  const [idea, setIdea] = useState<IdeaSpec | null>(null);

  useEffect(() => {
    setIdea(readStoredIdea(runId));
    setIdeaChecked(true);
  }, [runId]);

  const run = useRunStream(runId, idea);

  if (!ideaChecked) {
    return (
      <main className="flex min-h-screen flex-col">
        <Navbar />
      </main>
    );
  }

  if (!idea || !run) {
    return (
      <main className="flex min-h-screen flex-col">
        <Navbar />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="font-serif text-section font-semibold text-text">
            This run could not be found.
          </p>
          <p className="text-body text-muted">
            Runs only live for the browser tab that started them. Start a new one from the
            landing page.
          </p>
          <Link href="/" className="text-caption font-medium text-accent">
            Back to StartupLens
          </Link>
        </div>
      </main>
    );
  }

  const teams = TEAM_NAMES.map((name) => run.teams[name]);

  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />
      <RunHeader run={run} />
      <OrchestrationStrip run={run} />

      <div className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8">
        {run.status === "error" && (
          <div className="mb-6 rounded-card border border-danger bg-surface p-4">
            <p className="text-body font-medium text-danger">The run failed.</p>
            <p className="mt-1 text-caption text-muted">{run.error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard key={team.team} team={team} />
          ))}
        </div>

        {run.status === "done" && run.final_report && (
          <div className="mt-8 flex justify-center">
            <Link
              href={`/report/${run.final_report.run_id}`}
              className="inline-flex h-9 items-center justify-center rounded-control bg-accent px-4 text-body font-medium text-white transition-colors duration-150 ease-out hover:bg-accent/90"
            >
              Read the report
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
