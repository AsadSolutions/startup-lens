import {
  TEAM_LABELS,
  type TeamFailure,
  type TeamName,
  type TeamReport,
} from "@/lib/types";

export function TeamSection({
  team,
  report,
  failure,
  headingOverride,
}: {
  team: TeamName;
  report: TeamReport | null;
  failure: TeamFailure | null;
  headingOverride?: string;
}) {
  return (
    <section>
      <h2 className="font-serif text-section font-semibold text-text">
        {headingOverride ?? TEAM_LABELS[team]}
      </h2>

      {failure ? (
        <div className="mt-4 border-l-2 border-l-danger bg-surface px-4 py-3">
          <p className="text-body leading-[1.6] text-danger">
            This team failed: {failure.error}
          </p>
        </div>
      ) : report ? (
        <>
          <p className="mt-3 text-body leading-[1.6] text-text">
            {report.summary}
          </p>

          {report.truncated && (
            <p className="mt-2 text-caption text-warn">
              Wrapped up early on budget.
            </p>
          )}

          {report.key_insights.length > 0 && (
            <div className="mt-5">
              <p className="text-eyebrow font-medium uppercase tracking-eyebrow text-muted">
                Key findings
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-body leading-[1.6] text-text">
                {report.key_insights.map((insight) => (
                  <li key={insight}>{insight}</li>
                ))}
              </ul>
            </div>
          )}

          {report.risks.length > 0 && (
            <div className="mt-5">
              <p className="text-eyebrow font-medium uppercase tracking-eyebrow text-muted">
                Risks
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-body leading-[1.6] text-text">
                {report.risks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </div>
          )}

          {report.sources.length > 0 && (
            <ul className="mt-6 space-y-1 border-t border-border pt-4 text-caption text-muted">
              {report.sources.map((source) => (
                <li key={source.title}>
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-text"
                    >
                      {source.title}
                    </a>
                  ) : (
                    source.title
                  )}
                  {source.published && <> — {source.published}</>}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="mt-3 text-body text-muted">
          No report available for this team.
        </p>
      )}
    </section>
  );
}
