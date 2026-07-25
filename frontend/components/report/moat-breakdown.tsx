import {
  MOAT_DIMENSION_LABELS,
  MOAT_DIMENSION_NAMES,
  type MoatDimension,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const SEGMENTS = [0, 1, 2, 3, 4];

function segmentColor(score: number, index: number): string {
  if (index >= score) return "bg-surface-2";
  return score >= 3 ? "bg-ok" : "bg-warn";
}

export function MoatBreakdown({ dimensions }: { dimensions: MoatDimension[] }) {
  const byName = new Map(dimensions.map((d) => [d.dimension, d]));

  return (
    <section>
      <h2 className="font-serif text-section font-semibold text-text">
        MOAT Breakdown
      </h2>
      <div className="mt-5 flex flex-col gap-5">
        {MOAT_DIMENSION_NAMES.map((name) => {
          const dimension = byName.get(name);
          if (!dimension) return null;
          return (
            <div
              key={name}
              className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-6"
            >
              <div className="flex shrink-0 flex-col gap-1.5 sm:w-40">
                <span className="text-caption font-medium text-text">
                  {MOAT_DIMENSION_LABELS[name]}
                </span>
                <div
                  className="flex gap-1"
                  role="img"
                  aria-label={`${dimension.score} of 5`}
                >
                  {SEGMENTS.map((i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1.5 flex-1 rounded-control",
                        segmentColor(dimension.score, i),
                      )}
                    />
                  ))}
                </div>
              </div>
              <p className="text-body leading-[1.6] text-muted sm:flex-1">
                {dimension.justification}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
