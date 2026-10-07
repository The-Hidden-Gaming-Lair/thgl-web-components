"use client";
import { Check, ChevronDown, Layers3 } from "lucide-react";
import { useEffect, useState, type JSX } from "react";
import { create } from "zustand";
import { cn, type MapLayout, type TilesConfig } from "@repo/lib";
import { useUserStore } from "../(providers)";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import { getMapParam, setMapParam } from "./map-url-params";

/**
 * Layout picker for maps that exist in several generated layouts (Dune Awakening's
 * Deep Desert: 12 layouts, one per week on official servers, any of them on private
 * servers). The default follows the official current layout (`tiles[map].layout`,
 * the map's own markers + live data); picking another layout swaps the tiles
 * (interactive-map), the node blob and the dict patch (CoordinatesProvider).
 * Shareable as `?layout=<id>`; session-only otherwise, like TerraformStageSelect.
 */

type LayoutStore = {
  layoutByMap: Record<string, number>;
  setLayout: (mapName: string, layout: number | null) => void;
};
export const useMapLayoutStore = create<LayoutStore>((set) => ({
  layoutByMap: {},
  setLayout: (mapName, layout) =>
    set((s) => {
      const layoutByMap = { ...s.layoutByMap };
      if (layout === null) delete layoutByMap[mapName];
      else layoutByMap[mapName] = layout;
      return { layoutByMap };
    }),
}));

/** The picked NON-official layout of `mapName`, or undefined (= the map's own data). */
export function useSelectedMapLayout(
  tileOptions: TilesConfig | undefined,
  mapName: string | undefined,
): MapLayout | undefined {
  const picked = useMapLayoutStore((s) =>
    mapName ? s.layoutByMap[mapName] : undefined,
  );
  const tile = mapName ? tileOptions?.[mapName] : undefined;
  if (picked === undefined || !tile?.layouts || picked === tile.layout) {
    return undefined;
  }
  return tile.layouts.find((l) => l.id === picked);
}

export function MapLayoutSelect({
  tileOptions,
}: {
  tileOptions?: TilesConfig;
}): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const mapName = useUserStore((s) => s.mapName);
  const picked = useMapLayoutStore((s) => s.layoutByMap[mapName]);
  const setLayout = useMapLayoutStore((s) => s.setLayout);
  const tile = tileOptions?.[mapName];
  const layouts = tile?.layouts;
  const official = tile?.layout;

  // `?layout=` → store on load, map change and back/forward (shared links).
  useEffect(() => {
    if (!layouts) return;
    const apply = () => {
      const p = getMapParam("layout");
      const id = p === null ? NaN : Number(p);
      setLayout(
        mapName,
        layouts.some((l) => l.id === id) && id !== official ? id : null,
      );
    };
    apply();
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, [mapName, layouts, official, setLayout]);

  if (!layouts || layouts.length < 2) return null;
  const current = picked ?? official;
  const label = (id: number | undefined) =>
    id === undefined ? "Layout" : `Layout ${id}`;

  const select = (id: number | null) => {
    setLayout(mapName, id);
    setMapParam("layout", id === null ? null : String(id));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label="Map layout"
          className="flex items-center px-2.5 py-1.5 text-sm transition-colors hover:text-primary"
        >
          <Layers3 className="mr-2 h-3.5 w-3.5 shrink-0 text-amber-400" />
          <span className="truncate font-medium">
            {picked === undefined ? "Official" : label(current)}
          </span>
          <ChevronDown
            className={cn(
              "ml-1.5 h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-1 w-[300px]">
        <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Map layout
        </p>
        <p className="px-2 pb-1 text-xs text-muted-foreground">
          Playing on a private server? Pick the layout your server runs.
        </p>
        <ScrollArea className="max-h-80">
          <LayoutOption
            checked={picked === undefined}
            onClick={() => select(null)}
            title={`Official servers (${label(official)}, this week)`}
          />
          {layouts.map((l) => (
            <LayoutOption
              key={l.id}
              checked={picked === l.id}
              onClick={() => select(l.id === official ? null : l.id)}
              title={label(l.id)}
              note={l.resources ? undefined : "Fixed locations only"}
            />
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function LayoutOption({
  checked,
  onClick,
  title,
  note,
}: {
  checked: boolean;
  onClick: () => void;
  title: string;
  note?: string;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
    >
      <Check
        className={cn(
          "mr-2 h-4 w-4 shrink-0",
          checked ? "opacity-100" : "opacity-0",
        )}
      />
      <span className="truncate">{title}</span>
      {note && (
        <span className="ml-auto pl-2 text-xs text-muted-foreground">
          {note}
        </span>
      )}
    </button>
  );
}
