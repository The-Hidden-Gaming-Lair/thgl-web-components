"use client";
import { Settings2 } from "lucide-react";
import { useState } from "react";
import { presetBoundToMap, useSettingsStore } from "@repo/lib";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useT } from "../(providers)";

const EMPTY_HIDE_BY_MAP: Record<string, boolean> = {};
const EMPTY_PRESET_BY_MAP: Record<string, string> = {};
// Radix Select items cannot use "" as a value.
const NO_PRESET = "__thgl_no_preset__";

// Clicks inside the portalled content still bubble along the React tree into
// the map selector's CommandItem, which would switch maps.
const stop = (event: { stopPropagation: () => void }) =>
  event.stopPropagation();

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
  const t = useT();
  const [open, setOpen] = useState(false);
  const hideOverlayByMap = useSettingsStore(
    (s) => s.hideOverlayByMap ?? EMPTY_HIDE_BY_MAP,
  );
  const setHideOverlayOnMap = useSettingsStore((s) => s.setHideOverlayOnMap);
  const presets = useSettingsStore((s) => s.presets);
  const presetByMap = useSettingsStore(
    (s) => s.presetByMap ?? EMPTY_PRESET_BY_MAP,
  );
  const setPresetForMap = useSettingsStore((s) => s.setPresetForMap);
  const presetNames = Object.keys(presets);
  const boundPreset = presetBoundToMap(presetByMap, presets, mapName);

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
      <PopoverContent
        className="w-64 space-y-3"
        side="right"
        onPointerDown={stop}
        onPointerUp={stop}
        onMouseDown={stop}
        onMouseUp={stop}
        onClick={stop}
        onKeyDown={stop}
      >
        <div className="font-medium text-sm truncate">{mapLabel}</div>
        <div className="space-y-1.5">
          <Label className="block text-xs">
            {t("presets.mapAutoApply", { fallback: "Auto-apply preset" })}
          </Label>
          <Select
            value={boundPreset ?? NO_PRESET}
            onValueChange={(value) =>
              setPresetForMap(mapName, value === NO_PRESET ? null : value)
            }
            disabled={presetNames.length === 0}
          >
            <SelectTrigger
              className="h-7 text-xs"
              aria-label={t("presets.mapAutoApply", {
                fallback: "Auto-apply preset",
              })}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PRESET}>
                {t("presets.none", { fallback: "None" })}
              </SelectItem>
              {presetNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {presetNames.length === 0
              ? t("presets.mapAutoApplyEmpty", {
                  fallback: "Save a preset in the Presets menu first.",
                })
              : t("presets.mapAutoApplyHint", {
                  fallback: "Applied when you switch to this map.",
                })}
          </p>
        </div>
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
