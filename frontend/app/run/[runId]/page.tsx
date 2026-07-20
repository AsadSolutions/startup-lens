import { StubPage } from "@/components/stub-page";

export default async function RunPage(props: PageProps<"/run/[runId]">) {
  const { runId } = await props.params;
  return (
    <StubPage
      title="Run"
      runId={runId}
      description="The live board (five streaming team cards, run timer, spend meter) is built in Roadmap Phase 4."
    />
  );
}
