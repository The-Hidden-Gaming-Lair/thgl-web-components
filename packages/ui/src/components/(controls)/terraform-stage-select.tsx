"use client";
import { Sprout, ChevronDown, Check } from "lucide-react";
import { useEffect, useState, type JSX } from "react";
import { create } from "zustand";
import { cn, type TilesConfig } from "@repo/lib";
import { useUserStore } from "../(providers)";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import { getMapParam, setMapParam } from "./map-url-params";

/**
 * Terraform-stage backdrop selector for The Planet Crafter (and any game whose tiles
 * carry `.stages`). A planet's markers never change with terraforming — only the
 * satellite LOOK does (terrain colour + rising water) — so the "stages" are just
 * swappable BACKDROP tile pyramids nested under the base map's tile config
 * (`tileOptions[mapName].stages[stage].url`, same bounds → markers stay aligned).
 * Selecting a stage swaps only the tile-layer URL in interactive-map; `complete`
 * (== the base backdrop) is the default.
 */

// selected stage per base map — session-only (resets on reload; not worth persisting).
type StageStore = {
  stageByMap: Record<string, string>;
  setStage: (mapName: string, stage: string) => void;
};
export const useTerraformStage = create<StageStore>((set) => ({
  stageByMap: {},
  setStage: (mapName, stage) =>
    set((s) => ({ stageByMap: { ...s.stageByMap, [mapName]: stage } })),
}));

// Rough barren→complete progression across all planets' stage names (unknowns sort last).
const STAGE_ORDER = [
  "barren",
  "wasteland",
  "flooded",
  "water",
  "vegetation",
  "lakes",
  "corals",
  "moss",
  "plants",
  "waterplants",
  "trees",
  "cleanoceans",
  "life",
  "complete",
];
const stageRank = (s: string) => {
  const i = STAGE_ORDER.indexOf(s);
  return i === -1 ? STAGE_ORDER.length : i;
};
const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type StageMap = Record<string, { url: string }>;

export function TerraformStageSelect({
  tileOptions,
}: {
  tileOptions?: TilesConfig;
}): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const mapName = useUserStore((s) => s.mapName);
  const stageByMap = useTerraformStage((s) => s.stageByMap);
  const setStage = useTerraformStage((s) => s.setStage);

  const stages = (tileOptions?.[mapName] as { stages?: StageMap } | undefined)
    ?.stages;
  const names = stages
    ? Object.keys(stages).sort((a, b) => stageRank(a) - stageRank(b))
    : [];
  const defaultStage = names.includes("complete")
    ? "complete"
    : (names[names.length - 1] ?? "complete");

  // Sync from the URL (`?stage=`) → store on load, map change, and back/forward, so a
  // shared link reproduces the stage. The hook runs every render (before any early
  // return); guarded on `stages` inside. Writing happens on select (below).
  useEffect(() => {
    if (!stages) return;
    const apply = () => {
      const p = getMapParam("stage");
      setStage(mapName, p && p in stages ? p : defaultStage);
    };
    apply();
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, [mapName, stages, defaultStage, setStage]);

  if (!stages || names.length < 2) return null;
  const current = stageByMap[mapName] ?? defaultStage;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label="Terraform stage"
          className="flex items-center px-2.5 py-1.5 text-sm transition-colors hover:text-primary"
        >
          <Sprout className="mr-2 h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <span className="truncate font-medium">{label(current)}</span>
          <ChevronDown
            className={cn(
              "ml-1.5 h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-1 w-[200px]">
        <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Terraform stage
        </p>
        <ScrollArea className="max-h-72">
          {names.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setStage(mapName, name);
                // default stage → clean URL (no param); else share it.
                setMapParam("stage", name === defaultStage ? null : name);
                setOpen(false);
              }}
              className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  current === name ? "opacity-100" : "opacity-0",
                )}
              />
              <span className="truncate">{label(name)}</span>
            </button>
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
