"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function IdeaForm() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [industry, setIndustry] = useState("");
  const [geography, setGeography] = useState("");
  const [showContext, setShowContext] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!idea.trim()) return;
    const runId = crypto.randomUUID();
    router.push(`/run/${runId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <Textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="Describe your startup idea in a sentence or two."
        rows={3}
        required
        aria-label="Startup idea"
      />
      {showContext ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="Industry"
            aria-label="Industry"
          />
          <Input
            value={geography}
            onChange={(e) => setGeography(e.target.value)}
            placeholder="Geography"
            aria-label="Geography"
          />
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowContext(true)}
          className="self-start"
        >
          Add context
        </Button>
      )}
      <Button type="submit" className="self-start">
        Validate this idea
      </Button>
      <p className="text-caption text-muted">
        A run takes a few minutes and produces automated research, not investment advice.
      </p>
    </form>
  );
}
