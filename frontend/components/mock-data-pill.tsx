import { isMockMode } from "@/lib/config";

export function MockDataPill() {
  if (!isMockMode) return null;

  return (
    <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-caption text-muted">
      Mock data
    </span>
  );
}
