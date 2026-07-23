"use client";

import { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { Sheet } from "@/components/ui/sheet";
import { useMediaQuery } from "@/lib/use-media-query";
import { useTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

function ThemeOptions({ onSelect }: { onSelect?: () => void }) {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex flex-col gap-1">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => {
            setTheme(value);
            onSelect?.();
          }}
          aria-pressed={theme === value}
          className={cn(
            "flex items-center gap-2 rounded-control px-2 py-1.5 text-left text-body transition-colors duration-150 ease-out hover:bg-surface-2",
            theme === value ? "text-accent" : "text-text",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}

export function ThemeControl() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [sheetOpen, setSheetOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const Icon = resolvedTheme === "dark" ? Moon : Sun;

  if (isDesktop) {
    return (
      <Popover
        align="end"
        trigger={
          <Button variant="ghost" size="icon" aria-label="Theme settings">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </Button>
        }
      >
        <ThemeOptions />
      </Popover>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Theme settings"
        onClick={() => setSheetOpen(true)}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Theme">
        <ThemeOptions onSelect={() => setSheetOpen(false)} />
      </Sheet>
    </>
  );
}
