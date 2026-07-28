"use client";
import { Settings2 } from "lucide-react";
import { useState } from "react";
import { useSettingsStore } from "@repo/lib";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

const EMPTY_HIDE_BY_MAP: Record<string, boolean> = {};

/**
 * Per-map settings gear, the map-selector counterpart of
 * FilterSettingsPopover. Shown on ALL surfaces (web included — Peer Link makes
 * live per-map behavior relevant there, and more per-map options are planned);
 * the overlay auto-hide option itself only takes effect in the in-game
 * overlay windows.
 */
export function MapSettingsPopover({
  mapName,
  mapLabel,
}: {
  mapName: string;
  mapLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const hideOverlayByMap = useSettingsStore(
    (s) => s.hideOverlayByMap ?? EMPTY_HIDE_BY_MAP,
  );
  const setHideOverlayOnMap = useSettingsStore((s) => s.setHideOverlayOnMap);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="p-1.5 hover:text-primary transition-colors shrink-0 text-muted-foreground"
          onPointerDown={(e) => e.stopPropagation()}
          // cmdk's CommandItem selects on pointer-UP, so stopping only
          // pointerdown/click would still switch the map when opening the gear.
          onPointerUp={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          type="button"
          aria-label={`Map settings for ${mapLabel}`}
        >
          <Settings2 className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" side="right">
        <div className="font-medium text-sm truncate">{mapLabel}</div>
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs">Hide overlay on this map</Label>
          <Switch
            checked={!!hideOverlayByMap[mapName]}
            onCheckedChange={(checked) => setHideOverlayOnMap(mapName, checked)}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          The in-game overlay hides while you are on this map and returns when
          you leave. A small pill (or the fullscreen hotkey) shows it
          temporarily.
        </p>
      </PopoverContent>
    </Popover>
  );
}
