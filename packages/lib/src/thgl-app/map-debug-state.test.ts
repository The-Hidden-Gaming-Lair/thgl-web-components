import type { FiltersConfig } from "../config";
import { summarizeMapDebugState } from "./map-debug-state";

const filters = [
  {
    group: "amber",
    values: [
      { id: "amber_bug", icon: "", no_map_markers: true },
      { id: "amber_fish", icon: "", no_map_markers: true },
    ],
  },
  {
    group: "ore",
    values: [{ id: "copper", icon: "" }],
  },
] as unknown as FiltersConfig;

const typesIdMap = {
  "/Amber/Bug": "amber_bug",
  "/Amber/Fish": "amber_fish",
  "/Ore/Copper": "copper",
};

function summarize(
  settings: Parameters<typeof summarizeMapDebugState>[0]["settings"],
  activeFilters: string[] | undefined,
) {
  return summarizeMapDebugState({
    appId: "palia",
    sentFrom: "dashboard",
    settings,
    user: { mapName: "Highlands", filters: activeFilters },
    filters,
    typesIdMap,
    previewAccess: false,
    dataVersion: "v1",
  });
}

describe("summarizeMapDebugState", () => {
  it("reports Predicted mode as hiding every live-only filter (#898)", () => {
    const state = summarize({ liveMode: "static" }, ["amber_bug", "copper"]);
    expect(state.effectiveLiveMode).toBe("static");
    expect(state.mapName).toBe("Highlands");
    expect(state.liveOnlyFilters).toEqual([
      { id: "amber_bug", group: "amber", on: true, mode: "static" },
      { id: "amber_fish", group: "amber", on: false, mode: "static" },
    ]);
    expect(state.activeFilterCount).toBe(2);
    expect(state.trackedFilterCount).toBe(3);
    expect(state.trackedActiveCount).toBe(2);
  });

  it("applies per-filter overrides on top of the global mode", () => {
    const state = summarize(
      { liveMode: "live", liveModeByFilter: { amber_fish: "static" } },
      ["amber_bug", "amber_fish"],
    );
    expect(state.liveModeByFilter).toEqual({ amber_fish: "static" });
    expect(state.liveOnlyFilters.map((f) => [f.id, f.mode])).toEqual([
      ["amber_bug", "live"],
      ["amber_fish", "static"],
    ]);
  });

  it("falls back to the default settings when nothing is stored", () => {
    const state = summarize({}, undefined);
    expect(state.liveMode).toBe("live");
    expect(state.autoLiveModeWithMe).toBe(true);
    expect(state.hideOverlayWithoutMap).toBe(true);
    expect(state.activeFilterCount).toBe(0);
    expect(state.liveOnlyFilters.every((f) => !f.on)).toBe(true);
  });
});
