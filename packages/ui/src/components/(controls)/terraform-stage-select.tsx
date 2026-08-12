"use client";
import { Sprout, ChevronDown, Check, Upload } from "lucide-react";
import { useEffect, useState, type JSX } from "react";
import { create } from "zustand";
import {
  cn,
  parsePlanetCrafterSave,
  useGameState,
  type TilesConfig,
} from "@repo/lib";
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

// The game's FULL terraform progression (lowercased union across all planets) — for mapping
// the LIVE stage id emitted by THGLApp (any of the game's ~15 per-planet stages, many of which
// we didn't capture a backdrop for) to the nearest CAPTURED backdrop, rounding DOWN.
const GAME_ORDER = [
  "barren",
  "toxicwasteland",
  "flooded",
  "bluesky",
  "clouds",
  "rain",
  "toxicdust",
  "acidrains",
  "toxiceruptions",
  "water",
  "watercycle",
  "seismicactivity",
  "vegetationrenewal",
  "vegetation",
  "lakes",
  "corals",
  "seismicshocks",
  "moss",
  "herbs",
  "cleanatmosphere",
  "cleanwatercycle",
  "plants",
  "waterplants",
  "trees",
  "insects",
  "cleanoceans",
  "clearsky",
  "breathable",
  "fish",
  "amphibians",
  "mammals",
  "life",
  "complete",
];
const gameOrderIndex = (id: string): number => {
  const n = id.toLowerCase();
  const exact = GAME_ORDER.indexOf(n);
  if (exact >= 0) return exact;
  return GAME_ORDER.findIndex((g) => g.includes(n) || n.includes(g)); // e.g. water⊆watercycle
};
// Capture terraform thresholds per planet+stage (the terraform totals from data-mining
// stages.json) — for the "load from save" path, where the save gives a terraform TOTAL (a
// number) rather than a stage id. A save's total maps to the captured stage at-or-below it.
const STAGE_THRESHOLDS: Record<string, Record<string, number>> = {
  Prime: {
    barren: 1e6,
    water: 1e7,
    lakes: 1.2e8,
    moss: 4e8,
    trees: 5e9,
    complete: 5e12,
  },
  Humble: {
    barren: 1e6,
    water: 1e7,
    lakes: 1.2e8,
    moss: 4e8,
    trees: 5e9,
    complete: 5e12,
  },
  Selenea: { barren: 1e6, water: 3e8, plants: 3e9, life: 2e12, complete: 6e12 },
  Toxicity: {
    wasteland: 1e5,
    vegetation: 2e7,
    plants: 2e9,
    cleanoceans: 1e10,
    complete: 7e12,
  },
  Aqualis: {
    flooded: 1e6,
    corals: 4e8,
    waterplants: 1.5e10,
    life: 1.5e12,
    complete: 8e12,
  },
};
function totalToStage(
  planet: string,
  total: number,
  capturedKeys: string[],
): string | null {
  const th = STAGE_THRESHOLDS[planet];
  if (!th) return null;
  let best: string | null = null;
  let bestT = -1;
  for (const k of capturedKeys) {
    const t = th[k];
    if (t != null && t <= total && t > bestT) {
      bestT = t;
      best = k;
    }
  }
  return best;
}

// Live game stage id -> the captured backdrop key at-or-below it (nearest earlier stage).
function liveStageToCaptured(
  liveId: string,
  capturedKeys: string[],
): string | null {
  const liveIdx = gameOrderIndex(liveId);
  if (liveIdx < 0) return null;
  let best: string | null = null;
  let bestIdx = -1;
  for (const k of capturedKeys) {
    const ki = gameOrderIndex(k);
    if (ki >= 0 && ki <= liveIdx && ki > bestIdx) {
      bestIdx = ki;
      best = k;
    }
  }
  return best;
}

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

  // Live auto-follow: when the companion app feeds a terraform stage (THGLApp emits the current
  // stage id in the player payload), select the nearest captured backdrop for the current map.
  // Web (no live feed) leaves this undefined, so the URL/manual selection stays authoritative.
  const liveStage = useGameState((s) => s.player?.terraformStage);
  useEffect(() => {
    if (!stages || !liveStage) return;
    const key = liveStageToCaptured(liveStage, Object.keys(stages));
    if (key && key in stages) {
      setStage(mapName, key);
      setMapParam("stage", key === defaultStage ? null : key);
    }
  }, [liveStage, mapName, stages, defaultStage, setStage]);

  if (!stages || names.length < 2) return null;
  const current = stageByMap[mapName] ?? defaultStage;

  // "Load from save" (for players without the companion app): parse the uploaded save, read
  // each planet's terraform total, and select the matching captured backdrop per planet.
  const loadFromSave = async (file: File) => {
    try {
      const parsed = parsePlanetCrafterSave(await file.text());
      for (const pt of parsed.terraform) {
        if (!pt.planetId) continue;
        const sm = (
          tileOptions?.[pt.planetId] as { stages?: StageMap } | undefined
        )?.stages;
        if (!sm) continue;
        const key = totalToStage(pt.planetId, pt.total, Object.keys(sm));
        if (key && key in sm) setStage(pt.planetId, key);
      }
      // reflect the current map's resulting stage in the URL
      const cur = useTerraformStage.getState().stageByMap[mapName];
      if (cur) setMapParam("stage", cur === defaultStage ? null : cur);
    } catch {
      /* not a valid Planet Crafter save — ignore */
    }
    setOpen(false);
  };

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
        {/* Load the stage from a player's save file (no companion app needed). */}
        <div className="mt-1 border-t pt-1">
          <label className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
            <Upload className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">Load from save…</span>
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void loadFromSave(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </PopoverContent>
    </Popover>
  );
}
