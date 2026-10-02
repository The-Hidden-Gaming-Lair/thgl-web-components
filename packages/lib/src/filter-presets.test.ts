import {
  bindPresetToMap,
  dropPresetBindings,
  mapsForPreset,
  nextPresetName,
  normalizeFilterPreset,
  planPresetApply,
  presetBindingMap,
  presetBoundToMap,
  resolveAutoApplyPreset,
} from "./filter-presets";
import { useSettingsStore } from "./settings";

const TILES = {
  Overworld: {},
  Caves: {},
  Overworld_Floor1: { layer: { parent: "Overworld" } },
  Overworld_Floor2: { layer: { parent: "Overworld" } },
};

describe("planPresetApply", () => {
  const context = {
    globalFilterIds: ["g1", "g2"],
    defaultGlobalFilters: ["g1"],
  };

  it("splits local and global filters", () => {
    expect(planPresetApply(["a", "g2", "b"], context)).toEqual({
      filters: { local: ["a", "b"], global: ["g2"] },
      settings: {},
    });
  });

  it("falls back to the default globals when the preset has none", () => {
    expect(planPresetApply({ filters: ["a"] }, context).filters).toEqual({
      local: ["a"],
      global: ["g1"],
    });
  });

  it("leaves uncaptured categories alone", () => {
    const plan = planPresetApply({ audioAlertByFilter: { a: true } }, context);
    expect(plan.filters).toBeUndefined();
    expect(plan.settings).toEqual({ audioAlertByFilter: { a: true } });
  });

  it("restores icon sizes as one unit with defaults", () => {
    expect(
      planPresetApply({ iconSizeByGroup: { g: 2 } }, context).settings,
    ).toEqual({
      iconSizes: {
        baseIconSize: 1,
        iconSizeByGroup: { g: 2 },
        iconSizeByFilter: {},
      },
    });
  });

  it("normalizes legacy array presets", () => {
    expect(normalizeFilterPreset(["a"])).toEqual({ filters: ["a"] });
  });
});

describe("map bindings", () => {
  it("keeps one preset per map", () => {
    let byMap = bindPresetToMap(undefined, "Caves", "Mining");
    byMap = bindPresetToMap(byMap, "Caves", "Bugs");
    expect(byMap).toEqual({ Caves: "Bugs" });
    expect(bindPresetToMap(byMap, "Caves", null)).toEqual({});
  });

  it("lists the maps of a preset", () => {
    expect(
      mapsForPreset({ A: "Mining", B: "Bugs", C: "Mining" }, "Mining"),
    ).toEqual(["A", "C"]);
  });

  it("drops every binding of a deleted preset", () => {
    expect(
      dropPresetBindings({ A: "Mining", B: "Bugs", C: "Mining" }, "Mining"),
    ).toEqual({ B: "Bugs" });
  });

  it("ignores a binding to a preset that no longer exists", () => {
    expect(presetBoundToMap({ A: "Gone" }, { Kept: [] }, "A")).toBeNull();
    expect(presetBoundToMap({ A: "Kept" }, { Kept: [] }, "A")).toBe("Kept");
  });

  it("resolves floors to their surface", () => {
    expect(presetBindingMap("Overworld_Floor1", TILES)).toBe("Overworld");
    expect(presetBindingMap("Caves", TILES)).toBe("Caves");
    expect(presetBindingMap("Unknown")).toBe("Unknown");
  });
});

describe("resolveAutoApplyPreset", () => {
  const presets = { Mining: ["a"], Bugs: ["b"] };
  const presetByMap = { Caves: "Mining", Overworld: "Bugs" };
  const resolve = (prevMap: string | null, nextMap: string) =>
    resolveAutoApplyPreset({
      prevMap,
      nextMap,
      presetByMap,
      presets,
      tiles: TILES,
    });

  it("applies the preset bound to the new map", () => {
    expect(resolve("Overworld", "Caves")).toBe("Mining");
    expect(resolve("Caves", "Overworld")).toBe("Bugs");
  });

  it("changes nothing when the new map has no binding", () => {
    expect(
      resolveAutoApplyPreset({
        prevMap: "Caves",
        nextMap: "Overworld",
        presetByMap: { Caves: "Mining" },
        presets,
      }),
    ).toBeNull();
  });

  it("changes nothing without a real map change", () => {
    expect(resolve("Caves", "Caves")).toBeNull();
    // Entering or leaving a floor of the same surface is not a switch.
    expect(resolve("Overworld", "Overworld_Floor1")).toBeNull();
    expect(resolve("Overworld_Floor2", "Overworld")).toBeNull();
  });

  it("applies the surface binding when arriving on a floor", () => {
    expect(resolve("Caves", "Overworld_Floor1")).toBe("Bugs");
  });

  it("works with profiles saved before presetByMap existed", () => {
    expect(
      resolveAutoApplyPreset({
        prevMap: "A",
        nextMap: "B",
        presetByMap: undefined,
        presets,
      }),
    ).toBeNull();
  });
});

describe("settings store", () => {
  // The node test env has no localStorage; persist warns on every write.
  beforeAll(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("binds, rebinds and clears a map, and deleting a preset unbinds it", () => {
    const store = useSettingsStore.getState();
    store.addPreset("Mining", { filters: ["a"] });
    store.addPreset("Bugs", { filters: ["b"] });
    store.setPresetForMap("Caves", "Mining");
    store.setPresetForMap("Overworld", "Mining");
    expect(useSettingsStore.getState().presetByMap).toEqual({
      Caves: "Mining",
      Overworld: "Mining",
    });

    store.setPresetForMap("Caves", "Bugs");
    expect(useSettingsStore.getState().presetByMap.Caves).toBe("Bugs");

    store.removePreset("Mining");
    expect(useSettingsStore.getState().presetByMap).toEqual({ Caves: "Bugs" });

    store.setPresetForMap("Caves", null);
    expect(useSettingsStore.getState().presetByMap).toEqual({});

    // Persisted per profile, like the presets themselves.
    const { profiles, currentProfileId } = useSettingsStore.getState();
    const profile = profiles.find((p) => p.id === currentProfileId);
    expect(profile?.settings.presetByMap).toEqual({});
  });
});

describe("nextPresetName", () => {
  const names = ["Mining", "Bugs", "Fish"];

  it("steps through the presets in order and wraps around", () => {
    expect(nextPresetName(names, "Mining")).toBe("Bugs");
    expect(nextPresetName(names, "Bugs")).toBe("Fish");
    expect(nextPresetName(names, "Fish")).toBe("Mining");
  });

  it("starts at the first preset when the current one is unknown", () => {
    expect(nextPresetName(names, null)).toBe("Mining");
    expect(nextPresetName(names, "Deleted")).toBe("Mining");
  });

  it("returns null without saved presets", () => {
    expect(nextPresetName([], "Mining")).toBeNull();
  });
});
