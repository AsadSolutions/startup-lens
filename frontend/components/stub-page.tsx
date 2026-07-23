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
      <h1 className="text-section font-serif font-semibold text-text">
        {title} {runId}
      </h1>
      <p className="text-body text-muted">{description}</p>
    </main>
  );
}
