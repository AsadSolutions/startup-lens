import { ReportView } from "@/components/report/report-view";

export default async function ReportPage(props: PageProps<"/report/[runId]">) {
  const { runId } = await props.params;
  return <ReportView runId={runId} />;
}
