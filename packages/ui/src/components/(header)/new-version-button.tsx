"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@repo/lib";
import { Button } from "../(controls)";
import { useT } from "../(providers)";
import { useAppUpdateStore } from "../(providers)/app-update-store";
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

/** Interactions that count as "the user is busy with something else". */
const DISMISS_EVENTS = [
  "pointerdown",
  "keydown",
  "wheel",
  "touchstart",
] as const;

/**
 * The quiet "a new version is waiting" affordance, modelled on Discord's
 * update indicator: a small accented icon that appears in the header with its
 * label already showing, then gets out of the way the moment the user does
 * anything else. The icon stays until the page is reloaded, so the action is
 * never lost — only the label is transient.
 *
 * Renders nothing while the tab is in sync, so it costs no header space in the
 * normal case. It is the ONLY signal for a stale-but-working build: no toast,
 * because a stale tab is not an emergency and treating it as one meant
 * second-screen users (Peer Link on a tablet) got interrupted once per deploy
 * — five-plus times on a busy day.
 *
 * `broken` (a ChunkLoadError — navigation is actually dead) escalates the same
 * amber accent with a ring and keeps its persistent toast, because that one
 * really does need acting on.
 */
export function NewVersionButton({
  compact = false,
  autoLabel = true,
  className,
}: {
  /** 24px sizing to match the THGL app's window header. */
  compact?: boolean;
  /**
   * Show the label by itself as soon as the update lands. Turned off in the
   * game overlay, where an unprompted popup would sit on top of gameplay —
   * there the icon alone carries it and hovering still explains it.
   */
  autoLabel?: boolean;
  className?: string;
}) {
  const status = useAppUpdateStore((s) => s.status);
  const t = useT();
  const [labelOpen, setLabelOpen] = useState(false);

  const visible = status !== "current";

  useEffect(() => {
    if (!visible || !autoLabel) return;
    setLabelOpen(true);

    // Auto-close on the first interaction with anything else. Capture phase so
    // a click on some other control still dismisses it, and `once` so we stop
    // listening as soon as it has fired.
    const dismiss = () => setLabelOpen(false);
    for (const type of DISMISS_EVENTS) {
      document.addEventListener(type, dismiss, { capture: true, once: true });
    }
    return () => {
      for (const type of DISMISS_EVENTS) {
        document.removeEventListener(type, dismiss, { capture: true });
      }
    };
  }, [visible, autoLabel]);

  if (!visible) return null;

  const broken = status === "broken";
  const label = broken
    ? t("newVersion.broken", { fallback: "Reload required" })
    : t("newVersion.ready", { fallback: "Update Ready!" });

  return (
    <TooltipProvider>
      <Tooltip open={labelOpen} onOpenChange={setLabelOpen}>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            // No `title`: the Radix tooltip below already carries the label,
            // and a native title would double up on hover.
            aria-label={label}
            data-testid="new-version-button"
            data-status={status}
            className={cn(
              "text-amber-400 hover:text-amber-300",
              broken && "ring-2 ring-amber-500",
              compact && "h-6 w-6 mx-0.5",
              className,
            )}
            onClick={() => window.location.reload()}
          >
            <RefreshCw className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </Button>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent
            side="bottom"
            align="end"
            collisionPadding={8}
            data-testid="new-version-label"
            className="font-medium text-amber-400"
          >
            {label}
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </TooltipProvider>
  );
}
