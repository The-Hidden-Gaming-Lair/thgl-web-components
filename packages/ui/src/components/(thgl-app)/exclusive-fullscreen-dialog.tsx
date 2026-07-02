"use client";
import { useEffect, useState } from "react";
import { useLiveState } from "@repo/lib/thgl-app";
import { TriangleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

// Shown in the overlay window while the game runs in Exclusive Fullscreen -
// the game bypasses desktop composition, so the overlay flickers, disappears,
// or misses clicks (or with Fullscreen Optimizations off, doesn't render at
// all). State comes from the native exclusiveFullscreenChanged broadcast /
// getInitialState.
export function ExclusiveFullscreenDialog() {
  const exclusiveFullscreen = useLiveState(
    (state) => state.exclusiveFullscreen,
  );
  const [dismissed, setDismissed] = useState(false);

  // Re-arm the dialog once the game leaves exclusive fullscreen, so it shows
  // again if the user switches back later
  useEffect(() => {
    if (!exclusiveFullscreen) {
      setDismissed(false);
    }
  }, [exclusiveFullscreen]);

  if (!exclusiveFullscreen || dismissed) {
    return null;
  }

  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5 text-amber-400" />
            Exclusive Fullscreen detected
          </AlertDialogTitle>
        </AlertDialogHeader>

        <p>
          The game is running in Exclusive Fullscreen. In this mode the overlay
          can flicker, disappear, or ignore clicks.
        </p>
        <p>
          Switch the game&apos;s display mode to{" "}
          <span className="font-bold">Borderless / Windowed Fullscreen</span>{" "}
          for a stable overlay.
        </p>

        <AlertDialogCancel onClick={() => setDismissed(true)}>
          Got it
        </AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialog>
  );
}
