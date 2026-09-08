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
 * Invite-only gate: shown IN FRONT of the fully-rendered app (map + filters
 * stay behind it) when the current game's companion is `inviteOnly`
 * (games.ts) and the signed-in account's server-resolved `invites` don't
 * include it. Same non-modal construction and z-index as PreviewReleaseGate
 * (see there for why it is NOT a Radix modal). Unlike the preview gate there
 * is nothing to buy — access is granted per account by an admin
 * (www.th.gl/admin/invites) — so the card only offers sign-in (an invited
 * account may simply not be signed in yet) and close.
 */
export function InviteOnlyGate({
  title,
  isOverlay,
}: {
  title: string;
  isOverlay?: boolean;
}) {
  const setShowUserDialog = useAccountStore((s) => s.setShowUserDialog);
  const isSignedIn = useAccountStore((s) => s.userId !== null);

  const card = (
    <div className="pointer-events-auto flex max-w-sm flex-col items-center gap-4 rounded-lg border bg-background p-6 text-center text-white shadow-lg">
      <LockClosedIcon className="size-9 text-amber-400" />
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Invite only
      </p>
      <h1 className="text-xl font-semibold">{title} is invite only</h1>
      <p className="text-sm text-muted-foreground">
        The in-game companion for {title} is available to invited accounts only.{" "}
        {isSignedIn
          ? "This account has no invite for it."
          : "Sign in with the invited Patreon account to continue."}
      </p>
      <div className="mt-1 flex flex-col items-center gap-2">
        {!isSignedIn && (
          <Button onClick={() => setShowUserDialog(true)}>Sign in</Button>
        )}
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
      // Inline z-index: matches PreviewReleaseGate (99000 covers the map +
      // filter panel, stays below header/unlock/sign-in).
      style={{ zIndex: 99000 }}
      className={cn(
        "fixed inset-0 flex items-center justify-center p-8",
        // Desktop: dim + blur the map behind and block its clicks. Overlay:
        // transparent + click-through around the card.
        isOverlay
          ? "pointer-events-none bg-transparent"
          : "pointer-events-auto bg-background/80 backdrop-blur-sm",
      )}
    >
      {card}
    </div>
  );
}
