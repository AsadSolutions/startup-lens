import { TEAM_LABELS, type Contradiction } from "@/lib/types";

export function ContradictionCallout({
  contradictions,
}: {
  contradictions: Contradiction[];
}) {
  if (contradictions.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 border-l-2 border-l-warn bg-surface px-5 py-4">
      <p className="text-eyebrow font-medium uppercase tracking-eyebrow text-warn">
        Teams disagreed
      </p>
      {contradictions.map((contradiction) => (
        <p
          key={`${contradiction.teams[0]}-${contradiction.teams[1]}`}
          className="text-body leading-[1.6] text-text"
        >
          <span className="font-medium">
            {TEAM_LABELS[contradiction.teams[0]]} vs{" "}
            {TEAM_LABELS[contradiction.teams[1]]}.
          </span>{" "}
          {contradiction.description}
        </p>
      ))}
    </div>
  );
}
