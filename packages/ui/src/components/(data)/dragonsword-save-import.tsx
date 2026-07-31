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
  Package,
  Gamepad2,
  Landmark,
} from "lucide-react";

const API_URL = DATA_FORGE_URL + "/api/dragonsword-awakening/save";

type SaveParseResult = {
  discoveredNodeIds: string[];
  // Server summary (raw counts read from the save, before node-id mapping). Optional/loose so a
  // shape change on the server can never crash the modal.
  summary?: {
    openedChests?: number;
    completedMinigames?: number;
    statuePieces?: number;
    completedQuests?: number;
    areaQuests?: number;
    mapped?: number;
  };
  error?: string;
};

/**
 * Groups that map save data categories to map node types.
 * Grouping is done by the TYPE PREFIX of each returned node id
 * (ids are of the form "{filterType}@{lat}:{lng}").
 */
const SAVE_GROUPS = {
  chests: {
    label: "Treasure Chests",
    icon: Package,
    defaultOn: true,
    prefix: "chests_",
  },
  minigames: {
    label: "Minigames",
    icon: Gamepad2,
    defaultOn: true,
    prefix: "minigame_",
  },
  statues: {
    label: "Statue of Organa",
    icon: Landmark,
    defaultOn: true,
    prefix: "organa_",
  },
} as const;

type GroupKey = keyof typeof SAVE_GROUPS;
const GROUP_KEYS = Object.keys(SAVE_GROUPS) as GroupKey[];

/** Extract the filter type prefix from a node id ("chests_grade1@1:2" -> "chests_"). */
function nodeType(id: string): string {
  const at = id.indexOf("@");
  return at === -1 ? id : id.slice(0, at);
}

/** Compute per-group counts from the discovered node ids. */
function computeGroupStats(data: SaveParseResult) {
  const stats: Record<GroupKey, { found: number }> = {} as never;
  for (const key of GROUP_KEYS) {
    stats[key] = { found: 0 };
  }
  for (const id of data.discoveredNodeIds) {
    const type = nodeType(id);
    for (const key of GROUP_KEYS) {
      if (type.startsWith(SAVE_GROUPS[key].prefix)) {
        stats[key].found += 1;
        break;
      }
    }
  }
  return stats;
}

/** Filter discoveredNodeIds to only include selected groups by type prefix. */
function filterNodeIds(
  data: SaveParseResult,
  selectedGroups: Set<GroupKey>,
): string[] {
  const prefixes = [...selectedGroups].map((k) => SAVE_GROUPS[k].prefix);
  if (prefixes.length === 0) return [];

  const result: string[] = [];
  const seen = new Set<string>();
  for (const id of data.discoveredNodeIds) {
    if (seen.has(id)) continue;
    const type = nodeType(id);
    if (prefixes.some((p) => type.startsWith(p))) {
      seen.add(id);
      result.push(id);
    }
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

// The save lives inside the game's own Steam install folder (not Documents/AppData).
const SAVE_PATH =
  "steamapps\\common\\DragonSword  Awakening\\DS\\Saved\\SaveGames\\<SteamID>\\<SteamID>_Slot1.db";

export function DragonSwordSaveImport() {
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
    input.accept = ".db";

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
            <p className="text-xs text-muted-foreground">
              Your save is inside the game&apos;s Steam folder. In Steam,
              right-click{" "}
              <span className="text-foreground">DragonSword: Awakening</span> →{" "}
              <span className="text-foreground">
                Manage → Browse local files
              </span>
              , then open:
            </p>
            <div className="text-xs text-muted-foreground border rounded-md p-2.5 bg-muted/30 flex items-center gap-2">
              <span className="font-mono text-[11px] leading-relaxed select-all flex-1 break-all">
                {SAVE_PATH}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(SAVE_PATH);
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
                    {state.data.discoveredNodeIds.length.toLocaleString()}{" "}
                    {state.data.discoveredNodeIds.length === 1
                      ? "location found"
                      : "locations found"}
                  </span>
                  <span className="text-muted-foreground text-xs ml-auto">
                    Select what to mark
                  </span>
                </div>

                {/* Group selection */}
                <div className="border rounded-md overflow-hidden divide-y">
                  {GROUP_KEYS.map((key) => {
                    const group = SAVE_GROUPS[key];
                    const stat = groupStats[key];
                    const checked = selectedGroups.has(key);
                    const Icon = group.icon;

                    if (stat.found === 0) return null;

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
                        <div className="flex-1 min-w-0">
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
                            </span>
                          </div>
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
