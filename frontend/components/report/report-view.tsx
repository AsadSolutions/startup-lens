"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { ContradictionCallout } from "@/components/report/contradiction-callout";
import { MoatBreakdown } from "@/components/report/moat-breakdown";
import { ReadinessVerdict } from "@/components/report/readiness-verdict";
import { ReportHeader } from "@/components/report/report-header";
import { TeamSection } from "@/components/report/team-section";
import { getReport } from "@/lib/api";
import { TEAM_NAMES, type FinalReport, type TeamName } from "@/lib/types";

const TEAM_SECTION_ORDER: TeamName[] = TEAM_NAMES.filter(
  (team) => team !== "gtm_strategy",
);

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; report: FinalReport };

export function ReportView({ runId }: { runId: string }) {
  const [loadedRunId, setLoadedRunId] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  if (loadedRunId !== runId) {
    setLoadedRunId(runId);
    setState({ status: "loading" });
  }

  useEffect(() => {
    let active = true;
    getReport(runId)
      .then((report) => {
        if (active) setState({ status: "loaded", report });
      })
      .catch((err) => {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "The report could not be loaded.";
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
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="flex min-h-screen flex-col">
        <Navbar />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="font-serif text-section font-semibold text-text">
            This report could not be found.
          </p>
          <p className="text-body text-muted">{state.message}</p>
          <Link href="/" className="text-caption font-medium text-accent">
            Back to StartupLens
          </Link>
        </div>
      </main>
    );
  }

  const { report } = state;
  const findTeam = (team: TeamName) =>
    report.team_reports.find((r) => r.team === team) ?? null;
  const findFailure = (team: TeamName) =>
    report.team_failures.find((f) => f.team === team) ?? null;

  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />
      <ReportHeader report={report} />

      <div className="mx-auto flex w-full max-w-[780px] flex-1 flex-col gap-10 px-6 py-10">
        <section>
          <h2 className="font-serif text-section font-semibold text-text">
            Executive Summary
          </h2>
          <p className="mt-3 text-body leading-[1.6] text-text">
            {report.executive_summary}
          </p>
        </section>

        {TEAM_SECTION_ORDER.map((team) => (
          <TeamSection
            key={team}
            team={team}
            report={findTeam(team)}
            failure={findFailure(team)}
          />
        ))}

        <ContradictionCallout contradictions={report.contradictions} />

        <MoatBreakdown dimensions={report.moat_breakdown} />

        <TeamSection
          team="gtm_strategy"
          report={findTeam("gtm_strategy")}
          failure={findFailure("gtm_strategy")}
          headingOverride="GTM Plan"
        />

        <ReadinessVerdict
          verdict={report.readiness_verdict}
          note={report.readiness_note}
        />

        <p className="border-t border-border pt-6 text-center text-caption text-muted">
          This is automated research, not investment advice.
        </p>
      </div>
    </main>
  );
}
