"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export interface PopoverProps {
  trigger: ReactElement;
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
}

export function Popover({
  trigger,
  children,
  align = "end",
  className,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (e.key === "Tab" && contentRef.current) {
        const focusable =
          contentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    const focusable =
      contentRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable ?? contentRef.current)?.focus();

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const triggerElement = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<Record<string, unknown>>, {
        onClick: (e: React.MouseEvent) => {
          (
            trigger.props as { onClick?: (e: React.MouseEvent) => void }
          ).onClick?.(e);
          setOpen((o) => !o);
        },
        "aria-haspopup": "dialog",
        "aria-expanded": open,
        "aria-controls": contentId,
        ref: (node: HTMLElement | null) => {
          triggerRef.current = node;
        },
      })
    : trigger;

  return (
    <div ref={containerRef} className="relative inline-block">
      {triggerElement}
      {open && (
        <div
          id={contentId}
          ref={contentRef}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          className={cn(
            "absolute z-50 mt-2 min-w-48 rounded-card border border-border bg-surface p-2 shadow-card",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
