"use client";
import { useOverlayMapHidden, useSettingsStore } from "@repo/lib";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useT } from "../(providers)";

/**
 * Residual pill shown while the overlay map is auto-hidden — either the
 * player is on a flagged map (label = the map's name) or no map is detected
 * at all, e.g. the main menu (label = "Show Map"). Click = temporarily show
 * the overlay; the override reverts when the rule's condition ends
 * (leaving the map / a map being detected). Session-only; persisted settings
 * are untouched.
 * Positioned where the filters button normally sits (top-left, below the
 * header) — NOT bottom-right, where the movable ad window would cover it.
 * Not shown while the window is locked ("Hide Controls") — the locked overlay
 * is click-through, so the pill would be visible but unclickable; the
 * fullscreen hotkey still works as the way back.
 */
export function OverlayMapHiddenPill() {
  const { hidden, reason, playerMap, toggleOverride } = useOverlayMapHidden();
  const lockedWindow = useSettingsStore((s) => s.lockedWindow);
  const t = useT();
  if (!hidden || lockedWindow) return null;
  const noMap = reason === "noMap";
  const label = noMap
    ? "Show Map"
    : playerMap
      ? t(playerMap, { fallback: playerMap })
      : "Show Map";
  return (
    <Tooltip delayDuration={200} disableHoverableContent>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggleOverride}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Temporarily show the overlay map"
          className="fixed top-[40px] left-2 mt-px z-500 flex items-center gap-1.5 rounded-full border border-input bg-background/80 px-2.5 py-1 text-xs text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        >
          <Eye className="h-3.5 w-3.5" />
          <span className="max-w-32 truncate">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[260px]">
        {noMap ? (
          <>
            The overlay is hidden because no map is detected (e.g. main menu).
            Click to show it until a map is detected. Configurable in Settings →
            Maps.
          </>
        ) : (
          <>
            The overlay is hidden on this map. Click to show it temporarily — it
            hides again when you return here after leaving.
          </>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Quick action for the overlay map controls: flag/unflag the map the PLAYER
 * is currently on for overlay auto-hide. Hidden until the player's map is
 * known (fresh session, plain web).
 */
export function HideOverlayOnMapButton({ hidden }: { hidden?: boolean }) {
  const { playerMap, flagged } = useOverlayMapHidden();
  const setHideOverlayOnMap = useSettingsStore((s) => s.setHideOverlayOnMap);
  const t = useT();
  if (hidden || !playerMap) return null;
  const mapTitle = t(playerMap, { fallback: playerMap });
  return (
    <Tooltip delayDuration={200} disableHoverableContent>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label={
            flagged
              ? `Stop hiding the overlay on ${mapTitle}`
              : `Hide the overlay on ${mapTitle}`
          }
          onClick={() => setHideOverlayOnMap(playerMap, !flagged)}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {flagged ? <Eye /> : <EyeOff />}
        </Button>
      </TooltipTrigger>
      <TooltipContent className="w-64" side="bottom">
        {flagged ? (
          <p>
            The overlay auto-hides on <strong>{mapTitle}</strong>. Click to stop
            hiding it on this map.
          </p>
        ) : (
          <p>
            Hide the overlay while you are on <strong>{mapTitle}</strong>. It
            comes back when you leave; a small pill (or the fullscreen hotkey)
            shows it temporarily.
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
