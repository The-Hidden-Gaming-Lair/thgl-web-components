"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useSettingsStore } from "@repo/lib";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Section } from "./section";
import { useCoordinatesOptional, useT } from "../(providers)";

const EMPTY_HIDE_BY_MAP: Record<string, boolean> = {};

/**
 * Per-map settings, on ALL surfaces (web included — Peer Link makes live
 * per-map behavior relevant there, and more per-map options are planned).
 * The overlay auto-hide option itself only takes effect in the in-game
 * overlay windows. Renders null for single-map games.
 *
 * Map names come from the coordinates context when available (app/map pages);
 * dialogs mounted outside a CoordinatesProvider (e.g. the web root-layout
 * header) pass them via the `mapNames` prop instead.
 *
 * Games can have LOTS of maps (dungeons, sub-areas), so only the maps that
 * are currently hidden show by default; the full list is collapsed behind
 * "Show all maps" with a scroll cap.
 */
export function MapsSettingsSection({ mapNames }: { mapNames?: string[] }) {
  const [showAll, setShowAll] = useState(false);
  const coords = useCoordinatesOptional();
  const hideOverlayByMap = useSettingsStore(
    (s) => s.hideOverlayByMap ?? EMPTY_HIDE_BY_MAP,
  );
  const setHideOverlayOnMap = useSettingsStore((s) => s.setHideOverlayOnMap);
  const hideOverlayWithoutMap = useSettingsStore(
    (s) => s.hideOverlayWithoutMap ?? true,
  );
  const setHideOverlayWithoutMap = useSettingsStore(
    (s) => s.setHideOverlayWithoutMap,
  );
  const t = useT();

  const gameMaps = mapNames ?? coords?.mapNames ?? [];
  // Include stale flagged keys (map removed from the game / renamed) so users
  // can always unset them — lazy pruning per the spec.
  const allMaps = Array.from(
    new Set([...gameMaps, ...Object.keys(hideOverlayByMap)]),
  );
  // No maps at all (database-only games): nothing to configure. A single-map
  // game still gets the section for the no-map option below.
  if (allMaps.length === 0) return null;

  const flaggedMaps = allMaps.filter((mapName) => hideOverlayByMap[mapName]);
  const visibleMaps = showAll ? allMaps : flaggedMaps;

  const row = (mapName: string) => (
    <div key={mapName} className="flex items-center justify-between gap-2">
      <Label htmlFor={`hide-overlay-on-${mapName}`} className="truncate">
        {t(mapName, { fallback: mapName })}
      </Label>
      <Switch
        id={`hide-overlay-on-${mapName}`}
        checked={!!hideOverlayByMap[mapName]}
        onCheckedChange={(checked) => setHideOverlayOnMap(mapName, checked)}
      />
    </div>
  );

  return (
    <Section
      title="Maps"
      description="Hide the in-game overlay while you are on specific maps (e.g. your housing plot). It returns when you leave; a small pill (or the fullscreen hotkey) shows it temporarily."
    >
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="hide-overlay-without-map">
          Hide overlay when no map is detected
          <span className="block text-muted-foreground text-xs font-normal">
            e.g. in the main menu — a &quot;Show Map&quot; pill brings it back.
          </span>
        </Label>
        <Switch
          id="hide-overlay-without-map"
          checked={hideOverlayWithoutMap}
          onCheckedChange={setHideOverlayWithoutMap}
        />
      </div>
      {/* Per-map list only for multi-map games — flagging a game's ONLY map
          would just hide the overlay permanently. */}
      {allMaps.length > 1 && (
        <>
          {visibleMaps.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              No maps hidden. Expand the list below, or use the gear next to a
              map in the map selector.
            </p>
          ) : (
            // Native overflow scroll — same pattern as the Active Alerts list:
            // Radix ScrollArea needs a definite height, a max-height-only list
            // wouldn't scroll.
            <div className="max-h-48 space-y-2 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ring/50 [&::-webkit-scrollbar-track]:bg-transparent">
              {visibleMaps.map(row)}
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs gap-1"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Show hidden maps only ({flaggedMaps.length})
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Show all maps ({allMaps.length})
              </>
            )}
          </Button>
        </>
      )}
    </Section>
  );
}
