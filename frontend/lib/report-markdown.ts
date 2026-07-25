import {
  MOAT_DIMENSION_LABELS,
  MOAT_DIMENSION_NAMES,
  READINESS_VERDICT_LABELS,
  TEAM_LABELS,
  TEAM_NAMES,
  type FinalReport,
  type SourceRef,
  type TeamName,
  type TeamReport,
} from "./types";

function sourceLine(source: SourceRef): string {
  const date = source.published ? ` — ${source.published}` : "";
  return source.url
    ? `- [${source.title}](${source.url})${date}`
    : `- ${source.title}${date}`;
}

function teamBody(report: TeamReport): string[] {
  const lines = [report.summary];
  if (report.truncated) lines.push("", "_Wrapped up early on budget._");
  if (report.key_insights.length) {
    lines.push(
      "",
      "**Key findings**",
      "",
      ...report.key_insights.map((insight) => `- ${insight}`),
    );
  }
  if (report.risks.length) {
    lines.push("", "**Risks**", "", ...report.risks.map((risk) => `- ${risk}`));
  }
  if (report.sources.length) {
    lines.push("", "**Sources**", "", ...report.sources.map(sourceLine));
  }
  return lines;
}

function teamSection(
  finalReport: FinalReport,
  team: TeamName,
  heading: string = TEAM_LABELS[team],
): string[] {
  const report = finalReport.team_reports.find((r) => r.team === team);
  const failure = finalReport.team_failures.find((f) => f.team === team);
  const lines = [`## ${heading}`, ""];
  if (report) {
    lines.push(...teamBody(report));
  } else if (failure) {
    lines.push(`_This team failed: ${failure.error}_`);
  }
  return lines;
}

export function buildReportMarkdown(report: FinalReport): string {
  const nonGtmTeams = TEAM_NAMES.filter((team) => team !== "gtm_strategy");

  const lines: string[] = [
    `# ${report.idea.idea}`,
    "",
    `**${READINESS_VERDICT_LABELS[report.readiness_verdict]}** — ${report.readiness_note}`,
    "",
    "## Executive Summary",
    "",
    report.executive_summary,
  ];

  for (const team of nonGtmTeams) {
    lines.push("", ...teamSection(report, team));
  }

  if (report.contradictions.length) {
    lines.push("", "## Teams Disagreed", "");
    for (const contradiction of report.contradictions) {
      lines.push(
        `- **${TEAM_LABELS[contradiction.teams[0]]} vs ${TEAM_LABELS[contradiction.teams[1]]}:** ${contradiction.description}`,
      );
    }
  }

  lines.push("", "## MOAT Breakdown", "");
  for (const name of MOAT_DIMENSION_NAMES) {
    const dimension = report.moat_breakdown.find((d) => d.dimension === name);
    if (dimension) {
      lines.push(
        `- **${MOAT_DIMENSION_LABELS[name]}** (${dimension.score}/5): ${dimension.justification}`,
      );
    }
  }

  lines.push("", ...teamSection(report, "gtm_strategy", "GTM Plan"));

  lines.push(
    "",
    `## ${READINESS_VERDICT_LABELS[report.readiness_verdict]}`,
    "",
    report.readiness_note,
    "",
    "_This is automated research, not investment advice._",
  );

  return lines.join("\n");
}
