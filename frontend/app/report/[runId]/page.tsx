import { StubPage } from "@/components/stub-page";

export default async function ReportPage(props: PageProps<"/report/[runId]">) {
  const { runId } = await props.params;
  return (
    <StubPage
      title="Report"
      runId={runId}
      description="The report viewer (executive summary, team sections, MOAT breakdown, Markdown export) is built in Roadmap Phase 4."
    />
  );
}
