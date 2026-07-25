import Link from "next/link";
import {
  ArrowRight,
  Landmark,
  Rocket,
  ShieldCheck,
  Swords,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { IdeaInput } from "@/components/ui/input";
import { getExampleReports } from "@/lib/api";
import { READINESS_VERDICT_LABELS, type ReadinessVerdict } from "@/lib/types";

const teams: { icon: LucideIcon; name: string; description: string }[] = [
  {
    icon: TrendingUp,
    name: "Market Research",
    description:
      "Sizes the market, tracks growth trends, and defines who actually buys this.",
  },
  {
    icon: Swords,
    name: "Competitor Analysis",
    description:
      "Maps direct and indirect competitors on positioning, features, and price.",
  },
  {
    icon: Landmark,
    name: "Investment Landscape",
    description:
      "Surfaces recent funding rounds, active investors, and comparable valuations.",
  },
  {
    icon: ShieldCheck,
    name: "MOAT Scoring",
    description:
      "Scores defensibility across network effects, switching costs, tech edge, brand, and regulation.",
  },
  {
    icon: Rocket,
    name: "GTM Strategy",
    description:
      "Picks a beachhead segment, channels, pricing, and a first 90 days plan.",
  },
];

const verdictBadge: Record<ReadinessVerdict, string> = {
  promising: "bg-ok/10 text-ok",
  proceed_with_caution: "bg-warn/10 text-warn",
  weak: "bg-danger/10 text-danger",
};

const verdictDot: Record<ReadinessVerdict, string> = {
  promising: "bg-ok",
  proceed_with_caution: "bg-warn",
  weak: "bg-danger",
};

export default async function HomePage() {
  const examples = await getExampleReports();

  return (
    <main className="flex flex-col items-center">
      <Navbar />
      <section className="w-full px-6 pb-16 pt-16 sm:pt-24">
        <div className="mx-auto flex w-full max-w-[640px] flex-col items-start gap-5">
          <p className="text-eyebrow font-medium uppercase tracking-eyebrow text-muted">
            Fifteen agents, one verdict.
          </p>
          <h1 className="font-serif text-title font-semibold text-text sm:text-[2.5rem] sm:leading-[1.15]">
            Validate a startup idea in minutes, not weeks.
          </h1>
          <p className="text-body text-muted">
            Give it a startup idea, and 15 specialized agents in 5 parallel
            teams research the market, map competitors and investors, score the
            moat, and design a go to market strategy.
          </p>
          <IdeaInput />
          <p className="text-caption text-muted">
            A run takes a few minutes and produces automated research, not
            investment advice.
          </p>
        </div>
      </section>

      <section id="how-it-works" className="w-full px-6 py-20">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-eyebrow font-medium uppercase tracking-eyebrow text-muted">
              How it works
            </p>
            <h2 className="text-section font-serif font-semibold text-text">
              One idea. Five teams working at once.
            </h2>
            <p className="max-w-md text-body text-muted">
              Every team gets the same idea at the same time — no queue, no
              waiting on the team before it.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {teams.map((team) => {
              const Icon = team.icon;
              return (
                <div
                  key={team.name}
                  className="flex h-full flex-col gap-3 rounded-2xl bg-surface p-5 shadow-card transition-transform duration-150 ease-out hover:-translate-y-0.5"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft">
                    <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
                  </span>
                  <p className="text-body font-medium text-text">{team.name}</p>
                  <p className="text-caption leading-relaxed text-muted">
                    {team.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="examples" className="w-full px-6 py-20">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-eyebrow font-medium uppercase tracking-eyebrow text-muted">
              Examples
            </p>
            <h2 className="text-section font-serif font-semibold text-text">
              See what a report looks like.
            </h2>
            <p className="max-w-md text-body text-muted">
              Two real runs, start to finish — the idea, the verdict, and the
              summary behind it.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {examples.map((report) => (
              <Link
                key={report.run_id}
                href={`/report/${report.run_id}`}
                className="group flex h-full flex-col gap-4 rounded-2xl bg-surface p-6 shadow-card transition-transform duration-150 ease-out hover:-translate-y-0.5"
              >
                <span
                  className={`inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-caption font-medium ${verdictBadge[report.readiness_verdict]}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${verdictDot[report.readiness_verdict]}`}
                    aria-hidden="true"
                  />
                  {READINESS_VERDICT_LABELS[report.readiness_verdict]}
                </span>
                <p className="font-serif text-body font-medium leading-snug text-text">
                  {report.idea.idea}
                </p>
                <p className="line-clamp-3 flex-1 text-caption leading-relaxed text-muted">
                  {report.executive_summary}
                </p>
                <span className="inline-flex items-center gap-1 text-caption font-medium text-accent">
                  Read the report
                  <ArrowRight
                    className="h-3 w-3 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
