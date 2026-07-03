"use client";
import { useAccountStore } from "@repo/lib";
import { LockClosedIcon } from "@radix-ui/react-icons";
import { Button } from "../(controls)";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "../ui/alert-dialog";

// Close the companion window (the native host handles "closeWindow").
function closeAppWindow() {
  if (typeof window !== "undefined") {
    window.chrome?.webview?.postMessage("closeWindow");
  }
}

/**
 * Content-area lock shown by the in-game companion `App` when the current game
 * is an Elite Supporter preview (see `PREVIEW_ONLY_APPS` in app.tsx) and the
 * account lacks `perks.previewReleaseAccess`. The full app header stays usable;
 * only the map content is replaced. The web DB/map pages are never gated.
 *
 * On the desktop window it fills the content area; on the transparent game
 * overlay it opens as an alert dialog with a transparent backdrop so the game
 * stays visible. "Unlock" opens the account dialog (rendered by the header);
 * "Close" closes the companion window.
 */
export function PreviewReleaseGate({
  title,
  isOverlay,
}: {
  title: string;
  isOverlay?: boolean;
}) {
  const setShowUserDialog = useAccountStore((s) => s.setShowUserDialog);

  // AlertDialogTitle/Description need the AlertDialog context (overlay only);
  // fall back to plain elements when filling the desktop content area.
  const Heading = isOverlay ? AlertDialogTitle : "h1";
  const Desc = isOverlay ? AlertDialogDescription : "p";

  const body = (
    <>
      <LockClosedIcon className="size-9 text-amber-400" />
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Elite Supporter Preview
      </p>
      <Heading className="text-xl font-semibold">
        {title} is in early access
      </Heading>
      <Desc className="max-w-md text-sm text-muted-foreground">
        The in-game companion for {title} is available early to Elite Supporters
        with Preview Release Access — live mode, filters and the overlay — while
        the game support is finalized. The web database stays free for everyone.
      </Desc>
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
    </>
  );

  if (isOverlay) {
    return (
      <AlertDialog open>
        {/* z below the sign-in Dialog (content z-99090) so "Unlock" opens the
            account dialog ON TOP; above its backdrop (z-10005) so the preview
            stays visible. Inline z — the custom z utilities don't tw-merge. */}
        <AlertDialogContent
          overlayStyle={{ backgroundColor: "transparent", zIndex: 50000 }}
          style={{ zIndex: 50001 }}
          className="flex max-w-sm flex-col items-center gap-4 text-center text-white"
        >
          {body}
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center text-white">
      {body}
    </div>
  );
}
