export function StubPage({
  title,
  runId,
  description,
}: {
  title: string;
  runId: string;
  description: string;
}) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">
        {title} {runId}
      </h1>
      <p className="text-muted-foreground">{description}</p>
    </main>
  );
}
