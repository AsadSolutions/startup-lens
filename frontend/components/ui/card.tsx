import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Subtle accent-soft breathing pulse used by team cards while a run is in progress. */
  pulse?: boolean;
}

export function Card({ className, pulse, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface p-4 shadow-card",
        pulse && "animate-pulse-soft",
        className,
      )}
      {...props}
    />
  );
}
