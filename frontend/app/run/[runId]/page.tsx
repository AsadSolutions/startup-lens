import { RunBoard } from "@/components/board/run-board";

export default async function RunPage(props: PageProps<"/run/[runId]">) {
  const { runId } = await props.params;
  return <RunBoard runId={runId} />;
}
