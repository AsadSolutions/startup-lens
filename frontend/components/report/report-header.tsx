"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildReportMarkdown } from "@/lib/report-markdown";
import { READINESS_VERDICT_LABELS, type FinalReport } from "@/lib/types";
import { cn } from "@/lib/utils";

const DOT_COLOR: Record<FinalReport["readiness_verdict"], string> = {
  promising: "bg-ok",
  proceed_with_caution: "bg-warn",
  weak: "bg-danger",
};

const BADGE_COLOR: Record<FinalReport["readiness_verdict"], string> = {
  promising: "bg-ok/10 text-ok",
  proceed_with_caution: "bg-warn/10 text-warn",
  weak: "bg-danger/10 text-danger",
};

function downloadMarkdown(report: FinalReport) {
  const markdown = buildReportMarkdown(report);
  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `startuplens-report-${report.run_id}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportHeader({ report }: { report: FinalReport }) {
  return (
    <header className="border-b border-border bg-bg px-6 py-6">
      <div className="mx-auto flex w-full max-w-[780px] flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-medium",
              BADGE_COLOR[report.readiness_verdict],
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                DOT_COLOR[report.readiness_verdict],
              )}
              aria-hidden="true"
            />
            {READINESS_VERDICT_LABELS[report.readiness_verdict]}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadMarkdown(report)}
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Export as Markdown
          </Button>
        </div>
        <h1 className="font-serif text-title font-semibold leading-[1.3] text-text">
          {report.idea.idea}
        </h1>
      </div>
    </header>
  );
}
