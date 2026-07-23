import Link from "next/link";
import { getExampleReports } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { IdeaForm } from "@/components/idea-form";
import { READINESS_VERDICT_LABELS, type ReadinessVerdict } from "@/lib/types";
import { REPO_URL } from "@/lib/config";

const verdictColor: Record<ReadinessVerdict, string> = {
  promising: "text-ok",
  proceed_with_caution: "text-warn",
  weak: "text-danger",
};

export default async function HomePage() {
  const examples = await getExampleReports();

  return (
    <main className="mx-auto flex max-w-[720px] flex-col items-center gap-12 px-6 py-16">
      <div className="flex w-full max-w-sm flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt="StartupLens — Fifteen agents, one verdict."
          className="w-full dark:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-dark.svg"
          alt="StartupLens — Fifteen agents, one verdict."
          className="hidden w-full dark:block"
        />
      </div>

      <p className="text-center text-body text-muted">
        Give it a startup idea, and 15 specialized agents in 5 parallel teams research the
        market, map competitors and investors, score the moat, and design a go to market
        strategy.
      </p>

      <IdeaForm />

      <div className="flex w-full flex-col gap-4">
        <p className="text-eyebrow font-medium uppercase tracking-eyebrow text-muted">
          Example reports
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {examples.map((report) => (
            <Link key={report.run_id} href={`/report/${report.run_id}`}>
              <Card className="h-full transition-colors duration-150 ease-out hover:border-accent">
                <p className="truncate text-body text-text" title={report.idea.idea}>
                  {report.idea.idea}
                </p>
                <p className={`mt-2 text-caption font-medium ${verdictColor[report.readiness_verdict]}`}>
                  {READINESS_VERDICT_LABELS[report.readiness_verdict]}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <footer className="text-caption text-muted">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="transition-colors duration-150 ease-out hover:text-text"
        >
          GitHub
        </a>
      </footer>
    </main>
  );
}
