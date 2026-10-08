import { createUserStore, getOverlayZoom, setOverlayZoom } from "./user";
import { mapArrayValues, searchParamsToView, type View } from "./search-params";

// Pins the per-map view persistence (URL view → store → localStorage → back).
// Each of these boundaries has broken before: a NaN/Infinity camera persisted
// as null and blacked out one map for good, a view landed under the wrong map,
// the overlay's zoom got clobbered by the desktop window.

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  clear() {
    this.data.clear();
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  get length() {
    return this.data.size;
  }
}

const g = globalThis as { window?: unknown; localStorage?: unknown };
let storage: MemoryStorage;

const setPath = (pathname: string) => {
  // zustand's persist reads `window.localStorage`, user.ts the bare global.
  g.window = {
    location: { pathname, hostname: "localhost" },
    localStorage: storage,
  };
};

beforeEach(() => {
  storage = new MemoryStorage();
  g.localStorage = storage;
  setPath("/apps/test-game");
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  delete g.window;
  delete g.localStorage;
});

const MAPS = ["main", "cave", "island"];
const STORAGE = "thgl-coordinates-test-game";

const persist = (state: Record<string, unknown>, name = STORAGE) =>
  storage.setItem(name, JSON.stringify({ state, version: 2 }));

const create = (view: View = {}) => createUserStore(view, MAPS, []);

const persisted = (name = STORAGE) =>
  JSON.parse(storage.getItem(name) ?? "null")?.state;

describe("searchParamsToView", () => {
  it("parses map, center and zoom", () => {
    expect(
      searchParamsToView({ map: "cave", center: "12.5,-3", zoom: "4.25" }, []),
    ).toEqual({ map: "cave", center: [12.5, -3], zoom: 4.25 });
  });

  it.each([
    ["Infinity via exponent overflow", "1e999,5"],
    ["NaN", "abc,5"],
    ["one component missing", "5"],
    ["empty", ""],
  ])("drops a non-finite center (%s)", (_label, center) => {
    expect(searchParamsToView({ center }, []).center).toBeUndefined();
  });

  it.each(["1e999", "-1e999", "NaN", "x"])("drops non-finite zoom %s", (z) => {
    expect(searchParamsToView({ zoom: z }, []).zoom).toBeUndefined();
  });

  it("ignores array-valued params (repeated query keys)", () => {
    expect(
      searchParamsToView({ map: ["a", "b"], center: ["1,2", "3,4"] }, []),
    ).toEqual({});
  });

  it("round-trips filters through their index encoding", () => {
    const possible = ["wolf", "bear", "chest", "ore"];
    const f = mapArrayValues([...possible], ["ore", "bear"]);
    const view = searchParamsToView({ filters: JSON.stringify({ f }) }, [
      ...possible,
    ]);
    expect(view.filters?.sort()).toEqual(["bear", "ore"]);
  });

  it("survives malformed filters JSON and keeps the rest of the view", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    expect(
      searchParamsToView({ map: "cave", filters: "{not json" }, ["a"]),
    ).toEqual({ map: "cave" });
  });
});

describe("user store: setViewByMap", () => {
  it("stores a finite view under that map and persists it", () => {
    const store = create();
    store.getState().setViewByMap("cave", [1, 2], 3);
    expect(store.getState().viewByMap.cave).toEqual({
      center: [1, 2],
      zoom: 3,
    });
    expect(persisted().viewByMap.cave).toEqual({ center: [1, 2], zoom: 3 });
  });

  it.each([
    ["NaN center", [NaN, 1], 3],
    ["Infinity center", [1, Infinity], 3],
    ["NaN zoom", [1, 2], NaN],
    ["Infinity zoom", [1, 2], Infinity],
  ] as const)("refuses a %s and keeps the old view", (_l, center, zoom) => {
    const store = create();
    store.getState().setViewByMap("cave", [1, 2], 3);
    store
      .getState()
      .setViewByMap("cave", center as unknown as [number, number], zoom);
    expect(store.getState().viewByMap.cave).toEqual({
      center: [1, 2],
      zoom: 3,
    });
  });

  it("does not touch other maps' views", () => {
    const store = create();
    store.getState().setViewByMap("main", [5, 5], 2);
    store.getState().setViewByMap("cave", [1, 1], 6);
    expect(store.getState().viewByMap.main).toEqual({
      center: [5, 5],
      zoom: 2,
    });
  });
});

describe("user store: setMapName", () => {
  it("switching maps keeps each map's remembered view", () => {
    const store = create();
    store.getState().setViewByMap("main", [5, 5], 2);
    store.getState().setViewByMap("cave", [1, 1], 6);
    store.getState().setMapName("cave");
    expect(store.getState().mapName).toBe("cave");
    store.getState().setMapName("main");
    expect(store.getState().viewByMap).toEqual({
      main: { center: [5, 5], zoom: 2 },
      cave: { center: [1, 1], zoom: 6 },
    });
  });

  it("an explicit center/zoom updates only the target map", () => {
    const store = create();
    store.getState().setViewByMap("main", [5, 5], 2);
    store.getState().setMapName("cave", [7, 8], 4);
    expect(store.getState().viewByMap.cave).toEqual({
      center: [7, 8],
      zoom: 4,
    });
    expect(store.getState().viewByMap.main).toEqual({
      center: [5, 5],
      zoom: 2,
    });
  });

  it("a center without zoom keeps the remembered zoom", () => {
    const store = create();
    store.getState().setViewByMap("cave", [1, 1], 6);
    store.getState().setMapName("cave", [9, 9]);
    expect(store.getState().viewByMap.cave).toEqual({
      center: [9, 9],
      zoom: 6,
    });
  });

  it("ignores non-finite center/zoom but still switches the map", () => {
    const store = create();
    store.getState().setViewByMap("cave", [1, 1], 6);
    store.getState().setMapName("cave", [NaN, 0], Infinity);
    expect(store.getState().mapName).toBe("cave");
    expect(store.getState().viewByMap.cave).toEqual({
      center: [1, 1],
      zoom: 6,
    });
  });

  it("rejects a map that does not exist", () => {
    const store = create();
    store.getState().setMapName("nowhere", [1, 1], 1);
    expect(store.getState().mapName).toBe("main");
    expect(store.getState().viewByMap.nowhere).toBeUndefined();
  });
});

describe("user store: initial state and rehydrate", () => {
  it("without storage, starts on the URL map with the URL view", () => {
    const store = create({ map: "cave", center: [1, 2], zoom: 3 });
    expect(store.getState().mapName).toBe("cave");
    expect(store.getState().viewByMap).toEqual({
      cave: { center: [1, 2], zoom: 3 },
    });
  });

  it("without storage or URL map, starts on the first map", () => {
    expect(create().getState().mapName).toBe("main");
  });

  it("restores the persisted map and per-map views", () => {
    persist({
      mapName: "island",
      viewByMap: { island: { center: [3, 4], zoom: 5 } },
    });
    const store = create();
    expect(store.getState()._hasHydrated).toBe(true);
    expect(store.getState().mapName).toBe("island");
    expect(store.getState().viewByMap.island).toEqual({
      center: [3, 4],
      zoom: 5,
    });
  });

  it("heals views corrupted by a NaN/Infinity camera (serialized as null)", () => {
    persist({
      mapName: "cave",
      viewByMap: {
        cave: { center: [null, null], zoom: null },
        main: { center: [1, 2], zoom: null },
        island: null,
        bad: "garbage",
      },
    });
    const { viewByMap } = create().getState();
    expect(viewByMap).toEqual({ cave: {}, main: { center: [1, 2] } });
  });

  it("a URL view overrides the persisted view of that map only", () => {
    persist({
      mapName: "main",
      viewByMap: {
        main: { center: [5, 5], zoom: 2 },
        cave: { center: [1, 1], zoom: 6 },
      },
    });
    const store = create({ map: "cave", center: [9, 9] });
    expect(store.getState().mapName).toBe("cave");
    expect(store.getState().viewByMap).toEqual({
      main: { center: [5, 5], zoom: 2 },
      cave: { center: [9, 9], zoom: 6 },
    });
  });

  it("a URL map with no remembered view gets an empty view, not undefined", () => {
    persist({ mapName: "main", viewByMap: {} });
    expect(create({ map: "island" }).getState().viewByMap.island).toEqual({});
  });

  it("a persisted map that no longer exists falls back to the first map", () => {
    persist({ mapName: "removed-map", viewByMap: {} });
    expect(create().getState().mapName).toBe("main");
  });
});

describe("user store: storage name", () => {
  it("a locale-prefixed app path uses the same per-app storage", () => {
    setPath("/de/apps/test-game");
    const store = create();
    store.getState().setViewByMap("cave", [1, 1], 2);
    expect(persisted(STORAGE).viewByMap.cave).toEqual({
      center: [1, 1],
      zoom: 2,
    });
  });

  it("seeds the per-app storage from the generic one once", () => {
    persist({ mapName: "island", viewByMap: {} }, "coordinates");
    expect(create().getState().mapName).toBe("island");
    expect(storage.getItem(STORAGE)).not.toBeNull();
  });

  it("an existing per-app storage is never overwritten by the generic one", () => {
    persist({ mapName: "cave", viewByMap: {} });
    persist({ mapName: "island", viewByMap: {} }, "coordinates");
    expect(create().getState().mapName).toBe("cave");
  });

  it("non-app pages use the generic storage", () => {
    setPath("/");
    persist({ mapName: "island", viewByMap: {} }, "coordinates");
    expect(create().getState().mapName).toBe("island");
  });
});

describe("overlay zoom", () => {
  it("round-trips per map in its own key", () => {
    setOverlayZoom("main", 3.5);
    setOverlayZoom("cave", 6);
    expect(getOverlayZoom("main")).toBe(3.5);
    expect(getOverlayZoom("cave")).toBe(6);
    expect(getOverlayZoom("island")).toBeUndefined();
    expect(storage.getItem(`${STORAGE}-overlay-zoom`)).not.toBeNull();
  });

  it("is not clobbered by the main store persisting its whole blob", () => {
    setOverlayZoom("main", 3.5);
    const store = create();
    store.getState().setViewByMap("main", [0, 0], 1);
    store.getState().setMapName("cave", [1, 1], 7);
    expect(getOverlayZoom("main")).toBe(3.5);
  });

  it("ignores non-finite zooms", () => {
    setOverlayZoom("main", 2);
    setOverlayZoom("main", NaN);
    setOverlayZoom("main", Infinity);
    expect(getOverlayZoom("main")).toBe(2);
  });

  it("treats corrupt stored data as no zoom", () => {
    storage.setItem(`${STORAGE}-overlay-zoom`, "{broken");
    expect(getOverlayZoom("main")).toBeUndefined();
    storage.setItem(
      `${STORAGE}-overlay-zoom`,
      JSON.stringify({ main: null, cave: "4" }),
    );
    expect(getOverlayZoom("main")).toBeUndefined();
    expect(getOverlayZoom("cave")).toBeUndefined();
  });

  it("swallows storage errors (privacy mode / quota)", () => {
    jest.spyOn(storage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => setOverlayZoom("main", 2)).not.toThrow();
  });

  it("is a no-op on the server", () => {
    delete g.window;
    expect(() => setOverlayZoom("main", 2)).not.toThrow();
    expect(getOverlayZoom("main")).toBeUndefined();
  });
});

describe("user store: renamed / split filters", () => {
  const icon = "icon.webp";
  const FILTERS = [
    {
      group: "egg_heist",
      defaultOn: false,
      values: [
        { id: "eh_egg_nest", icon },
        { id: "eh_chest_a", icon, replaces: ["eh_legendary_chest"] },
        { id: "eh_chest_b", icon, replaces: ["eh_legendary_chest"] },
      ],
    },
  ];
  const createWith = (view: View = {}) => createUserStore(view, MAPS, FILTERS);

  it("switches on every successor of a saved dead id and drops it", () => {
    persist({ filters: ["eh_egg_nest", "eh_legendary_chest", "region_x"] });
    expect(createWith().getState().filters.sort()).toEqual(
      ["eh_chest_a", "eh_chest_b", "eh_egg_nest", "region_x"].sort(),
    );
  });

  it("leaves a selection without the old id alone", () => {
    persist({ filters: ["eh_egg_nest"] });
    expect(createWith().getState().filters).toEqual(["eh_egg_nest"]);
  });

  it("does not add a successor twice", () => {
    persist({ filters: ["eh_chest_a", "eh_legendary_chest"] });
    expect(createWith().getState().filters.sort()).toEqual([
      "eh_chest_a",
      "eh_chest_b",
    ]);
  });

  it("keeps an old id that still exists as a filter", () => {
    const filters = [
      {
        group: "g",
        values: [
          { id: "old", icon },
          { id: "new", icon, replaces: ["old"] },
        ],
      },
    ];
    persist({ filters: ["old"] });
    expect(createUserStore({}, MAPS, filters).getState().filters).toEqual([
      "old",
    ]);
  });

  it("a filters URL view wins over the saved selection", () => {
    persist({ filters: ["eh_legendary_chest"] });
    expect(createWith({ filters: ["eh_egg_nest"] }).getState().filters).toEqual(
      ["eh_egg_nest"],
    );
  });
});
