import { READINESS_VERDICT_LABELS, type ReadinessVerdict as ReadinessVerdictType } from "@/lib/types";
import { cn } from "@/lib/utils";

const DOT_COLOR: Record<ReadinessVerdictType, string> = {
  promising: "bg-ok",
  proceed_with_caution: "bg-warn",
  weak: "bg-danger",
};

const TEXT_COLOR: Record<ReadinessVerdictType, string> = {
  promising: "text-ok",
  proceed_with_caution: "text-warn",
  weak: "text-danger",
};

export function ReadinessVerdict({
  verdict,
  note,
}: {
  verdict: ReadinessVerdictType;
  note: string;
}) {
  return (
    <section>
      <div className="flex items-center gap-2">
        <span
          className={cn("h-2 w-2 rounded-full", DOT_COLOR[verdict])}
          aria-hidden="true"
        />
        <h2
          className={cn(
            "font-serif text-section font-semibold",
            TEXT_COLOR[verdict],
          )}
        >
          {READINESS_VERDICT_LABELS[verdict]}
        </h2>
      </div>
      <p className="mt-3 text-body leading-[1.6] text-text">{note}</p>
    </section>
  );
}
