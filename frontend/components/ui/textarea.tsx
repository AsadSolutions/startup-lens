"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { writeStoredIdea } from "@/lib/idea-handoff";
import { cn } from "@/lib/utils";

export function Textarea() {
  const router = useRouter();
  const [idea, setIdea] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = idea.trim();
    if (!trimmed) return;
    const runId = crypto.randomUUID();
    writeStoredIdea(runId, { idea: trimmed, industry: null, geography: null });
    router.push(`/run/${runId}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-2 rounded-xl border border-border bg-surface p-4 transition-colors duration-150 ease-out focus-within:border-accent"
    >
      <textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="Describe your startup idea…"
        aria-label="Startup idea"
        rows={2}
        required
        className="w-full resize-none bg-transparent text-body text-text placeholder:text-muted focus:outline-none"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          aria-label="Validate this idea"
          disabled={!idea.trim()}
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors duration-150 ease-out hover:bg-accent/90 disabled:pointer-events-none disabled:opacity-40",
          )}
        >
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
