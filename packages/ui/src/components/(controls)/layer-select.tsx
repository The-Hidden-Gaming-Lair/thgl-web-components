import { Check, ChevronDown, Layers } from "lucide-react";
import { useMemo, useState, type JSX } from "react";
import { cn, localizePath, type TilesConfig } from "@repo/lib";
import { useUserStore, useLocale, useT } from "../(providers)";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

/**
 * "Layered Map" picker for hierarchical/interior areas — the equivalent of the
 * official 分层地图. A layered map is tagged with `tiles[map].layer`
 * ({ parent, group, floor, label }):
 *   - `group`  = one interior AREA (all its floors share it),
 *   - `floor`  = which floor within the area,
 *   - `label`  = the area's display name,
 *   - `parent` = the surface map it sits on (e.g. Overworld).
 *
 * The MAIN MapSelect keeps showing the parent surface; here you pick which
 * interior AREA to descend into, and — only when an area has more than one
 * floor — a second control picks the FLOOR. Renders nothing unless the current
 * surface actually has interiors.
 */
type Floor = { mapName: string; floor: number; label: string };
type Area = { group: string; label: string; floors: Floor[] };

function buildAreas(
  tiles: TilesConfig,
  parentMap: string,
  t: (k: string) => string,
): Area[] {
  const byGroup = new Map<string, Area>();
  for (const [mapName, cfg] of Object.entries(tiles)) {
    const layer = cfg.layer;
    if (!layer || layer.parent !== parentMap) continue;
    let a = byGroup.get(layer.group);
    if (!a) {
      a = {
        group: layer.group,
        label: layer.label || t(mapName) || mapName,
        floors: [],
      };
      byGroup.set(layer.group, a);
    }
    a.floors.push({
      mapName,
      floor: layer.floor,
      label: `Floor ${layer.floor}`,
    });
  }
  const areas = [...byGroup.values()];
  for (const a of areas) a.floors.sort((x, y) => x.floor - y.floor);
  areas.sort((a, b) => a.label.localeCompare(b.label));
  return areas;
}

export function LayerSelect({
  tileOptions,
}: {
  tileOptions: TilesConfig;
}): JSX.Element | null {
  const [areaOpen, setAreaOpen] = useState(false);
  const [floorOpen, setFloorOpen] = useState(false);
  const mapName = useUserStore((state) => state.mapName);
  const setMapName = useUserStore((state) => state.setMapName);
  const t = useT();
  const locale = useLocale();

  // The surface this picker belongs to: the parent when we're on a floor,
  // otherwise the current (top-level) map itself.
  const parentMap = tileOptions[mapName]?.layer?.parent ?? mapName;
  const areas = useMemo(
    () => buildAreas(tileOptions, parentMap, t),
    [tileOptions, parentMap, t],
  );

  if (!areas.length) return null;

  const activeLayer = tileOptions[mapName]?.layer;
  const activeArea = activeLayer
    ? (areas.find((a) => a.group === activeLayer.group) ?? null)
    : null;
  const activeFloor =
    activeArea?.floors.find((f) => f.mapName === mapName) ?? null;

  const go = (target: string) => {
    if (target === mapName) return;
    setMapName(target);
    if (location.pathname.includes("/maps/")) {
      const title = tileOptions[target]?.defaultTitle ?? target;
      window.history.pushState({}, "", localizePath(`/maps/${title}`, locale));
    }
  };

  return (
    <div className="flex items-center border-l">
      {/* AREA picker — descend into an interior, or return to the surface. */}
      <Popover open={areaOpen} onOpenChange={setAreaOpen}>
        <PopoverTrigger asChild>
          <button
            role="combobox"
            aria-expanded={areaOpen}
            aria-label="Select layered area"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm transition-colors hover:text-primary"
            type="button"
          >
            <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium max-w-[9rem]">
              {activeArea ? activeArea.label : "Layered Map"}
            </span>
            <ChevronDown
              className={cn(
                "h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200",
                areaOpen && "rotate-180",
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-1 w-56">
          {/* Return to the surface. */}
          <button
            type="button"
            className={cn(
              "flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
              !activeArea && "bg-accent/50",
            )}
            onClick={() => {
              setAreaOpen(false);
              go(parentMap);
            }}
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4 shrink-0",
                !activeArea ? "opacity-100" : "opacity-0",
              )}
            />
            <span className="truncate">{t(parentMap) || parentMap}</span>
          </button>
          <div className="my-1 h-px bg-border" />
          {areas.map((a) => (
            <button
              key={a.group}
              type="button"
              className={cn(
                "flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
                activeArea?.group === a.group && "bg-accent/50",
              )}
              onClick={() => {
                setAreaOpen(false);
                // Enter at the lowest floor of the area.
                go(a.floors[0]!.mapName);
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4 shrink-0",
                  activeArea?.group === a.group ? "opacity-100" : "opacity-0",
                )}
              />
              <span className="truncate">{a.label}</span>
              {a.floors.length > 1 && (
                <span className="ml-auto pl-2 text-xs text-muted-foreground">
                  {a.floors.length} floors
                </span>
              )}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {/* FLOOR picker — only for multi-floor areas. */}
      {activeArea && activeArea.floors.length > 1 && (
        <Popover open={floorOpen} onOpenChange={setFloorOpen}>
          <PopoverTrigger asChild>
            <button
              role="combobox"
              aria-expanded={floorOpen}
              aria-label="Select floor"
              className="flex items-center gap-1.5 border-l px-2.5 py-1.5 text-sm transition-colors hover:text-primary"
              type="button"
            >
              <span className="truncate font-medium">
                {activeFloor?.label ?? activeArea.floors[0]!.label}
              </span>
              <ChevronDown
                className={cn(
                  "h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200",
                  floorOpen && "rotate-180",
                )}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent className="p-1 w-40">
            {activeArea.floors.map((f) => (
              <button
                key={f.mapName}
                type="button"
                className={cn(
                  "flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
                  f.mapName === mapName && "bg-accent/50",
                )}
                onClick={() => {
                  setFloorOpen(false);
                  go(f.mapName);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 shrink-0",
                    f.mapName === mapName ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="truncate">{f.label}</span>
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
