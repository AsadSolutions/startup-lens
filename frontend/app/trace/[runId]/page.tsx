import { TraceView } from "@/components/trace/trace-view";

export default async function TracePage(props: PageProps<"/trace/[runId]">) {
  const { runId } = await props.params;
  return <TraceView runId={runId} />;
}
