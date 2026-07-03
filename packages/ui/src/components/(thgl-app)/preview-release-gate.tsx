"use client";
import { cn, useAccountStore } from "@repo/lib";
import { LockClosedIcon } from "@radix-ui/react-icons";
import { Button } from "../(controls)";

// Close the companion window (the native host handles "closeWindow").
function closeAppWindow() {
  if (typeof window !== "undefined") {
    window.chrome?.webview?.postMessage("closeWindow");
  }
}

/**
 * Elite Supporter paywall: shown IN FRONT of the fully-rendered app (map +
 * filters stay behind it) when the current game is a preview (PREVIEW_ONLY_APPS
 * in app.tsx) and the account lacks `perks.previewReleaseAccess`. The web
 * DB/map pages are never gated.
 *
 * It is intentionally NOT a Radix modal — those set `pointer-events: none` on
 * the rest of the page and trap the keyboard, which broke the window-unlock
 * button and hotkeys (F9…). Its z-index (99000) covers the map + filter panel
 * but stays below the header (z-999999), the unlock button (z-99999) and the
 * sign-in dialog (z-99090) so all of those work on top. On the desktop window
 * it dims/blurs everything behind it (a paywall); on the transparent game
 * overlay it floats as a card and lets clicks pass through around it. "Unlock" opens the account dialog (rendered by
 * the header); "Close" closes the companion window.
 */
export function PreviewReleaseGate({
  title,
  isOverlay,
}: {
  title: string;
  isOverlay?: boolean;
}) {
  const setShowUserDialog = useAccountStore((s) => s.setShowUserDialog);

  const card = (
    <div className="pointer-events-auto flex max-w-sm flex-col items-center gap-4 rounded-lg border bg-background p-6 text-center text-white shadow-lg">
      <LockClosedIcon className="size-9 text-amber-400" />
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Elite Supporter Preview
      </p>
      <h1 className="text-xl font-semibold">{title} is in early access</h1>
      <p className="text-sm text-muted-foreground">
        The in-game companion for {title} is available early to Elite Supporters
        with Preview Release Access — live mode, filters and the overlay — while
        the game support is finalized. The web database stays free for everyone.
      </p>
      <div className="mt-1 flex flex-col items-center gap-2">
        <Button onClick={() => setShowUserDialog(true)}>
          Unlock with Elite Supporter
        </Button>
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          onClick={closeAppWindow}
        >
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <div
      // Inline z-index: the custom named z utilities (z-999999 etc.) don't
      // tw-merge against an arbitrary `z-[…]`, so set it directly. 99000 covers
      // the map + filter panel (z-500), below header/unlock/sign-in.
      style={{ zIndex: 99000 }}
      className={cn(
        "fixed inset-0 flex items-center justify-center p-8",
        // Desktop: dim + blur the map behind (a paywall) and block its clicks.
        // Overlay: transparent + click-through around the card (the game shows
        // through); only the card itself is interactive.
        isOverlay
          ? "pointer-events-none bg-transparent"
          : "pointer-events-auto bg-background/80 backdrop-blur-sm",
      )}
    >
      {card}
    </div>
  );
}
