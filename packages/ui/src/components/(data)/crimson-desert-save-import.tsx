"use client";

import { useState, useCallback, useMemo } from "react";
import { DATA_FORGE_URL, useSettingsStore } from "@repo/lib";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import {
  Upload,
  FileCheck,
  Loader2,
  AlertCircle,
  Copy,
  Pickaxe,
  Flame,
  Compass,
  Leaf,
  Skull,
  Scroll,
  BookOpen,
  Gem,
  Swords,
  Package,
} from "lucide-react";

const API_URL = DATA_FORGE_URL + "/api/crimson-desert/save";

type SaveParseResult = {
  discoveredNodeIds: string[];
  playerPosition: { x: number; y: number; z: number } | null;
  summary: {
    waypoints: number;
    chests: number;
    knowledge: number;
    quests: number;
    totalDiscovered: number;
    mapped?: number;
    matchedWaypoints?: number;
    matchedChests?: number;
    matchedQuests?: number;
    matchedKnowledge?: number;
    waypointsByType?: Record<string, number>;
  };
  totals?: Record<string, number>;
  nodeIdsByCategory?: {
    quests: string[];
    knowledge: string[];
    waypoints: string[];
    chests: string[];
    weaponDisplays?: string[];
    hiddenItems?: string[];
  };
  error?: string;
};

/** Groups that map save data categories to map node types */
const SAVE_GROUPS = {
  quests: {
    label: "Quests",
    icon: Scroll,
    defaultOn: true,
    // Node IDs starting with these prefixes
    types: [] as string[],
  },
  knowledge: {
    label: "Knowledge",
    icon: BookOpen,
    defaultOn: true,
    types: [] as string[],
    // Knowledge nodes are mapped to faction_quest nodes — they share prefixes
    // so we track them via the matchedKnowledge count instead
  },
  mines: {
    label: "Mines",
    icon: Pickaxe,
    defaultOn: false,
    types: [
      "mine_iron",
      "mine_copper",
      "mine_silver",
      "mine_gold",
      "mine_diamond",
      "mine_ruby",
      "mine_bismuth",
      "mine_bluestone",
      "mine_greenstone",
      "mine_redstone",
      "mine_whitestone",
      "mine_sulfur",
      "mine_blacksmith",
    ],
  },
  abyss: {
    label: "Abyss",
    icon: Skull,
    defaultOn: true,
    types: [
      "abyss_nexus",
      "abyss_cresset",
      "abyss_ruins",
      "abyss_gate",
      "abyss_bridge",
      "abyss_constellation",
    ],
  },
  stations: {
    label: "Stations",
    icon: Flame,
    defaultOn: true,
    types: [
      "bonfire",
      "cooking_station",
      "crafting_anvil",
      "alchemy_station",
      // Kept in sync with the waypoint types the save lookup can return — a type
      // missing here is silently dropped from the import (it matches no group prefix).
      "sewing_station",
      "carpentry_station",
    ],
  },
  landmarks: {
    label: "Landmarks",
    icon: Compass,
    defaultOn: true,
    types: [
      "treasure_box",
      "religion_box",
      "sealed_artifact",
      "teleport_gate",
      "dungeon",
      "tunnel",
      "bell",
      "well",
      "greymane_shrine",
      "memory_fragment",
      "housing_move",
    ],
  },
  gathering: {
    label: "Gathering",
    icon: Leaf,
    defaultOn: false,
    types: [
      "jijeongta_leaf",
      "taro",
      "chaya",
      "amaranth",
      "dulse",
      "ensete",
      "opuntia",
      "chlorella",
      "kudzu_vine",
      "rubber",
      "mercury",
    ],
  },
  chests: {
    label: "Chests",
    icon: Gem,
    defaultOn: true,
    types: ["collection_chest", "treasure_box"],
  },
  weaponDisplays: {
    label: "Weapon Displays",
    icon: Swords,
    defaultOn: true,
    types: [] as string[],
  },
  hiddenItems: {
    label: "Hidden Items",
    icon: Package,
    defaultOn: true,
    types: [] as string[],
  },
} as const;

type GroupKey = keyof typeof SAVE_GROUPS;
const GROUP_KEYS = Object.keys(SAVE_GROUPS) as GroupKey[];

/** Compute per-group stats from API response */
function computeGroupStats(data: SaveParseResult) {
  const wbt = data.summary.waypointsByType || {};
  const totals = data.totals || {};

  const stats: Record<GroupKey, { found: number; total: number }> = {} as never;

  for (const key of GROUP_KEYS) {
    const group = SAVE_GROUPS[key];
    if (key === "quests") {
      stats[key] = {
        found: data.summary.quests,
        total: totals.quests || 0,
      };
    } else if (key === "knowledge") {
      stats[key] = {
        found: data.summary.knowledge,
        total: totals.knowledge || 0,
      };
    } else if (key === "chests") {
      stats[key] = {
        found:
          (data.summary as unknown as Record<string, number>).matchedChests ||
          0,
        total:
          (totals.treasure_box || 0) +
          (totals.collection_chest || 0) +
          (totals.sealed_artifact || 0) +
          (totals.chest || 0) +
          (totals.treasure_chest_level || 0) +
          (totals.puzzle_chest || 0),
      };
    } else if (key === "weaponDisplays") {
      stats[key] = {
        found:
          (data.summary as unknown as Record<string, number>)
            .matchedWeaponDisplays || 0,
        total: totals.weapon_display || 0,
      };
    } else if (key === "hiddenItems") {
      stats[key] = {
        found:
          (data.summary as unknown as Record<string, number>)
            .matchedHiddenItems || 0,
        total: totals.hidden_item || 0,
      };
    } else {
      let found = 0;
      let total = 0;
      for (const t of group.types) {
        found += wbt[t] || 0;
        total += totals[t] || 0;
      }
      stats[key] = { found, total };
    }
  }

  return stats;
}

/** Filter discoveredNodeIds to only include selected groups using per-category data */
function filterNodeIds(
  data: SaveParseResult,
  selectedGroups: Set<GroupKey>,
): string[] {
  const byCategory = data.nodeIdsByCategory;
  const result: string[] = [];
  const seen = new Set<string>();

  const add = (ids: string[]) => {
    for (const id of ids) {
      if (!seen.has(id)) {
        seen.add(id);
        result.push(id);
      }
    }
  };

  // Category-level groups (use exact lists from API, no prefix guessing)
  if (byCategory) {
    if (selectedGroups.has("quests")) add(byCategory.quests);
    if (selectedGroups.has("knowledge")) add(byCategory.knowledge);
    if (selectedGroups.has("chests")) add(byCategory.chests);
    if (selectedGroups.has("weaponDisplays"))
      add(byCategory.weaponDisplays || []);
    if (selectedGroups.has("hiddenItems")) add(byCategory.hiddenItems || []);

    // Waypoint groups: filter the waypoints list by type prefix
    if (byCategory.waypoints.length > 0) {
      const allowedPrefixes: string[] = [];
      for (const key of selectedGroups) {
        const group = SAVE_GROUPS[key];
        if (group.types.length > 0) {
          allowedPrefixes.push(...group.types.map((t) => t + "@"));
        }
      }
      if (allowedPrefixes.length > 0) {
        add(
          byCategory.waypoints.filter((id) =>
            allowedPrefixes.some((p) => id.startsWith(p)),
          ),
        );
      }
    }
  } else {
    // Fallback for old API without nodeIdsByCategory
    add(data.discoveredNodeIds);
  }

  return result;
}

type State =
  | { step: "idle" }
  | { step: "uploading" }
  | { step: "result"; data: SaveParseResult }
  | { step: "error"; message: string };

const DEFAULT_SELECTION = new Set(
  GROUP_KEYS.filter((k) => SAVE_GROUPS[k].defaultOn),
);

export function CrimsonDesertSaveImport() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({ step: "idle" });
  const [selectedGroups, setSelectedGroups] =
    useState<Set<GroupKey>>(DEFAULT_SELECTION);
  const setDiscoveredNodes = useSettingsStore((s) => s.setDiscoveredNodes);
  const discoveredNodes = useSettingsStore((s) => s.discoveredNodes);

  const groupStats = useMemo(
    () => (state.step === "result" ? computeGroupStats(state.data) : null),
    [state],
  );

  const filteredCount = useMemo(() => {
    if (state.step !== "result") return 0;
    return filterNodeIds(state.data, selectedGroups).length;
  }, [state, selectedGroups]);

  const handleFile = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".save";

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setState({ step: "uploading" });
      setSelectedGroups(new Set(DEFAULT_SELECTION));

      try {
        const buffer = await file.arrayBuffer();
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: buffer,
        });

        const data: SaveParseResult = await response.json();

        if (!response.ok || data.error) {
          setState({ step: "error", message: data.error || "Parse failed" });
          return;
        }

        setState({ step: "result", data });
      } catch {
        setState({ step: "error", message: "Failed to connect to server" });
      }
    };

    input.click();
  }, []);

  const toggleGroup = useCallback((key: GroupKey) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const applyToMap = useCallback(
    (merge: boolean) => {
      if (state.step !== "result") return;
      const filtered = filterNodeIds(state.data, selectedGroups);

      if (filtered.length === 0) {
        toast.error("No groups selected");
        return;
      }

      if (merge) {
        const merged = [...new Set([...discoveredNodes, ...filtered])];
        const added = merged.length - discoveredNodes.length;
        setDiscoveredNodes(merged);
        toast.success(`Added ${added} new discoveries`);
      } else {
        setDiscoveredNodes(filtered);
        toast.success(`Set ${filtered.length} discovered items`);
      }

      setState({ step: "idle" });
      setOpen(false);
    },
    [state, selectedGroups, discoveredNodes, setDiscoveredNodes, setOpen],
  );

  const handleOpenChange = useCallback((v: boolean) => {
    setOpen(v);
    if (!v) setState({ step: "idle" });
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 text-xs h-8"
        onClick={() => setOpen(true)}
      >
        <Upload className="h-3.5 w-3.5" />
        Import Save File
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[480px] gap-0 p-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import Save File
            </DialogTitle>
            <DialogDescription>
              Upload your save file to mark discovered locations on the map.
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 pb-5 space-y-3">
            <div className="text-xs text-muted-foreground border rounded-md p-2.5 bg-muted/30 flex items-center gap-2">
              <span className="font-mono text-[11px] leading-relaxed select-all flex-1">
                %LocalAppData%\Pearl Abyss\CD\save
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(
                    "%LocalAppData%\\Pearl Abyss\\CD\\save",
                  );
                  toast.success("Path copied");
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>

            {state.step === "idle" && (
              <Button className="w-full gap-2" onClick={handleFile}>
                <Upload className="h-4 w-4" />
                Select Save File
              </Button>
            )}

            {state.step === "uploading" && (
              <Button className="w-full gap-2" disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
                Parsing save file...
              </Button>
            )}

            {state.step === "error" && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-destructive border border-destructive/30 rounded-md p-3 bg-destructive/5">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {state.message}
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleFile}
                >
                  Try Again
                </Button>
              </div>
            )}

            {state.step === "result" && groupStats && (
              <div className="space-y-3">
                {/* Header with summary */}
                <div className="flex items-center gap-2 text-sm">
                  <FileCheck className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="font-medium">
                    {state.data.summary.totalDiscovered.toLocaleString()}{" "}
                    discoveries found
                  </span>
                  <span className="text-muted-foreground text-xs ml-auto">
                    Select what to mark
                  </span>
                </div>

                {/* Group selection with progress */}
                <div className="border rounded-md overflow-hidden divide-y">
                  {GROUP_KEYS.map((key) => {
                    const group = SAVE_GROUPS[key];
                    const stat = groupStats[key];
                    const checked = selectedGroups.has(key);
                    const pct =
                      stat.total > 0
                        ? Math.min(100, (stat.found / stat.total) * 100)
                        : 0;
                    const Icon = group.icon;
                    const isEmpty = stat.found === 0 && stat.total === 0;

                    if (isEmpty) return null;

                    return (
                      <label
                        key={key}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors hover:bg-muted/40 ${
                          checked ? "bg-muted/20" : "opacity-60"
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleGroup(key)}
                          className="shrink-0"
                        />
                        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span
                              className={
                                checked
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }
                            >
                              {group.label}
                            </span>
                            <span className="font-medium tabular-nums text-xs">
                              {stat.found.toLocaleString()}
                              {stat.total > 0 && (
                                <span className="text-muted-foreground font-normal">
                                  {" / "}
                                  {stat.total.toLocaleString()}
                                </span>
                              )}
                            </span>
                          </div>
                          {stat.total > 0 && (
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct >= 100
                                    ? "bg-green-500"
                                    : pct >= 50
                                      ? "bg-primary"
                                      : "bg-primary/70"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Selected count + note */}
                <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                  <span>
                    <span className="text-foreground font-medium tabular-nums">
                      {filteredCount.toLocaleString()}
                    </span>{" "}
                    locations will be marked
                  </span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
                    onClick={() => {
                      const allSelected = GROUP_KEYS.every((k) =>
                        selectedGroups.has(k),
                      );
                      setSelectedGroups(
                        allSelected
                          ? new Set(DEFAULT_SELECTION)
                          : new Set(GROUP_KEYS),
                      );
                    }}
                  >
                    {GROUP_KEYS.every((k) => selectedGroups.has(k))
                      ? "Reset"
                      : "Select all"}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    className="flex-1"
                    onClick={() => applyToMap(true)}
                    disabled={filteredCount === 0}
                  >
                    Merge with existing
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => applyToMap(false)}
                    disabled={filteredCount === 0}
                  >
                    Replace all
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={handleFile}
                >
                  Select a different file
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
