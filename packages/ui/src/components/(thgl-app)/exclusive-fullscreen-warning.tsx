"use client";
import { useLiveState } from "@repo/lib/thgl-app";
import { TriangleAlert } from "lucide-react";
import { useT } from "../(providers)";

// Shown while the running game is in Exclusive Fullscreen - the game bypasses
// desktop composition, so the overlay window can't be displayed over it.
// State comes from the native exclusiveFullscreenChanged broadcast.
export function ExclusiveFullscreenWarning() {
  const t = useT();
  const exclusiveFullscreen = useLiveState(
    (state) => state.exclusiveFullscreen,
  );

  if (!exclusiveFullscreen) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
      <TriangleAlert className="h-4 w-4 shrink-0 text-amber-400" />
      <span>{t("game.exclusiveFullscreenWarning")}</span>
    </div>
  );
}
