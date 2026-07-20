import { StubPage } from "@/components/stub-page";

export default async function TracePage(props: PageProps<"/trace/[runId]">) {
  const { runId } = await props.params;
  return (
    <StubPage
      title="Trace"
      runId={runId}
      description="The orchestration trace (fan-out timeline, per-team timing and spend, failures) is built in Roadmap Phase 4."
    />
  );
}
