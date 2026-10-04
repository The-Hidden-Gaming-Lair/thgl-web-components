import {
  ChecklistImportError,
  checklistStorageKey,
  countChecklist,
  countChecklistGroups,
  decodeChecklistShareCode,
  encodeChecklistShareCode,
  exportChecklistJson,
  filterChecklistEntries,
  mergeChecklistProgress,
  parseChecklistJson,
  parseChecklistProgress,
  serializeChecklistProgress,
  setChecklistEntries,
  toggleChecklistEntry,
} from "./checklist";
import {
  createFilterTypeLookup,
  findFilterTypesForDbEntry,
} from "./db-map-links";
import type { FiltersConfig } from "./config";

const entries = [
  { id: "pal_1", name: "Lamball", groupId: "neutral" },
  { id: "pal_2", name: "Cattiva", groupId: "neutral" },
  { id: "pal_3", name: "Chikipi", groupId: "neutral" },
  { id: "pal_4", name: "Foxparks", groupId: "fire", text: "Kindling" },
  { id: "pal_5", name: "Pokémon-ish Été", groupId: "fire" },
];

describe("checklist progress storage", () => {
  it("uses one key per game", () => {
    expect(checklistStorageKey("palworld")).toBe("thgl-checklist:palworld");
  });

  it("round-trips and drops junk", () => {
    const raw = serializeChecklistProgress({
      paldeck: ["pal_1", "pal_1", "pal_2"],
      empty: [],
    });
    expect(parseChecklistProgress(raw)).toEqual({
      paldeck: ["pal_1", "pal_2"],
    });
    expect(parseChecklistProgress(null)).toEqual({});
    expect(parseChecklistProgress("{not json")).toEqual({});
    expect(parseChecklistProgress('{"sections":{"a":[1,"x",null]}}')).toEqual({
      a: ["x"],
    });
  });

  it("toggles and sets immutably", () => {
    const p0 = {};
    const p1 = toggleChecklistEntry(p0, "paldeck", "pal_1");
    expect(p1).toEqual({ paldeck: ["pal_1"] });
    expect(p0).toEqual({});
    const p2 = toggleChecklistEntry(p1, "paldeck", "pal_1");
    expect(p2).toEqual({});
    const p3 = setChecklistEntries(p2, "paldeck", ["pal_1", "pal_2"], true);
    expect(p3.paldeck.sort()).toEqual(["pal_1", "pal_2"]);
    expect(setChecklistEntries(p3, "paldeck", ["pal_2"], false)).toEqual({
      paldeck: ["pal_1"],
    });
  });
});

describe("checklist counting", () => {
  it("counts only current entries", () => {
    const ids = entries.map((e) => e.id);
    expect(countChecklist(ids, ["pal_1", "pal_4", "removed_by_patch"])).toEqual(
      { done: 2, total: 5, percent: 40 },
    );
    expect(countChecklist([], [])).toEqual({ done: 0, total: 0, percent: 0 });
    // Floors to one decimal: 1/3 → 33.3, never rounds up to 100 early.
    expect(countChecklist(["a", "b", "c"], ["a"]).percent).toBe(33.3);
    const many = Array.from({ length: 1000 }, (_, i) => String(i));
    expect(countChecklist(many, many.slice(0, 999)).percent).toBe(99.9);
  });

  it("counts per group in first-seen order", () => {
    const groups = countChecklistGroups(entries, new Set(["pal_2", "pal_4"]));
    expect([...groups.entries()]).toEqual([
      ["neutral", { done: 1, total: 3 }],
      ["fire", { done: 1, total: 2 }],
    ]);
  });
});

describe("checklist filtering", () => {
  const checked = new Set(["pal_1", "pal_4"]);
  const ids = (list: { id: string }[]) => list.map((e) => e.id);

  it("filters by group, missing-only and search", () => {
    expect(ids(filterChecklistEntries(entries, checked, {}))).toHaveLength(5);
    expect(
      ids(filterChecklistEntries(entries, checked, { group: "fire" })),
    ).toEqual(["pal_4", "pal_5"]);
    expect(
      ids(filterChecklistEntries(entries, checked, { missingOnly: true })),
    ).toEqual(["pal_2", "pal_3", "pal_5"]);
    expect(
      ids(
        filterChecklistEntries(entries, checked, {
          group: "neutral",
          missingOnly: true,
          query: "chi",
        }),
      ),
    ).toEqual(["pal_3"]);
  });

  it("matches text and ignores case/diacritics", () => {
    expect(
      ids(filterChecklistEntries(entries, checked, { query: "kindling" })),
    ).toEqual(["pal_4"]);
    expect(
      ids(
        filterChecklistEntries(entries, checked, { query: "POKEMON-ISH ete" }),
      ),
    ).toEqual(["pal_5"]);
  });
});

describe("checklist export / import", () => {
  it("round-trips the JSON export", () => {
    const progress = { paldeck: ["pal_1"], fish: ["fish_9"] };
    const json = exportChecklistJson("palworld", progress);
    expect(parseChecklistJson(json, "palworld")).toEqual(progress);
  });

  it("rejects garbage and another game's export", () => {
    expect(() => parseChecklistJson("nope", "palworld")).toThrow(
      ChecklistImportError,
    );
    expect(() => parseChecklistJson('{"a":1}', "palworld")).toThrow(
      ChecklistImportError,
    );
    try {
      parseChecklistJson(exportChecklistJson("heartopia", {}), "palworld");
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as ChecklistImportError).reason).toBe("wrong-game");
      expect((e as ChecklistImportError).game).toBe("heartopia");
    }
  });

  it("merges or replaces per imported section", () => {
    const current = { paldeck: ["pal_1"], fish: ["fish_1"] };
    const incoming = { paldeck: ["pal_2"] };
    expect(mergeChecklistProgress(current, incoming, "merge")).toEqual({
      paldeck: ["pal_1", "pal_2"],
      fish: ["fish_1"],
    });
    expect(mergeChecklistProgress(current, incoming, "replace")).toEqual({
      paldeck: ["pal_2"],
      fish: ["fish_1"],
    });
    expect(mergeChecklistProgress(current, { fish: [] }, "replace")).toEqual({
      paldeck: ["pal_1"],
    });
  });

  it("round-trips a share code with a shared id prefix", () => {
    const ids = Array.from(
      { length: 300 },
      (_, i) => `item_1501001${1000 + i}`,
    );
    const code = encodeChecklistShareCode("outfit-sets", ids);
    expect(code.startsWith("CL1.outfit-sets.")).toBe(true);
    // The prefix is stored once, so the code stays far below the raw id list.
    expect(code.length).toBeLessThan(ids.join(",").length / 2);
    const decoded = decodeChecklistShareCode(code);
    expect(decoded?.section).toBe("outfit-sets");
    expect(decoded?.ids.sort()).toEqual([...ids].sort());
  });

  it("keeps odd ids and non-ASCII intact", () => {
    const ids = ["boss@3_3:2", 'Ōkami, the "wolf"', "a.b.c"];
    const decoded = decodeChecklistShareCode(
      encodeChecklistShareCode("bestiary", ids),
    );
    expect(decoded?.ids.sort()).toEqual([...ids].sort());
    expect(decodeChecklistShareCode(encodeChecklistShareCode("x", []))).toEqual(
      { section: "x", ids: [] },
    );
  });

  it("rejects invalid codes", () => {
    expect(decodeChecklistShareCode("")).toBeNull();
    expect(decodeChecklistShareCode("CL1.paldeck")).toBeNull();
    expect(decodeChecklistShareCode("XX1.paldeck.abc")).toBeNull();
    expect(decodeChecklistShareCode("CL1.paldeck.%%%")).toBeNull();
  });
});

describe("createFilterTypeLookup", () => {
  const value = (id: string, extra: Record<string, unknown> = {}) => ({
    id,
    icon: "",
    ...extra,
  });
  const filters = [
    {
      group: "pals",
      values: [
        value("sheepball"),
        value("sheepball_boss", { dbSection: "paldeck", dbEntryId: "pal_1" }),
        value("foxparks"),
        value("foxparks_live", { no_map_markers: true }),
        value("chikipi_alpha", { dbSection: "paldeck", dbEntryId: "pal_9" }),
      ],
    },
  ] as unknown as FiltersConfig;
  const enDict: Record<string, string> = {
    pal_1: "Lamball",
    sheepball: "Lamball",
    pal_4: "Foxparks",
    foxparks: "Foxparks",
    foxparks_live: "Foxparks",
    pal_3: "Chikipi",
    chikipi_alpha: "@ptr",
    "@ptr": "Chikipi",
    pal_2: "Ox",
  };

  it("matches findFilterTypesForDbEntry for every entry", () => {
    const lookup = createFilterTypeLookup({
      section: "paldeck",
      filters,
      enDict,
    });
    for (const id of ["pal_1", "pal_2", "pal_3", "pal_4", "pal_9", "nope"]) {
      expect(lookup(id)).toEqual(
        findFilterTypesForDbEntry({ section: "paldeck", id, filters, enDict }),
      );
    }
    expect(lookup("pal_1")).toEqual(["sheepball_boss"]);
    expect(lookup("pal_4")).toEqual(["foxparks"]);
    expect(lookup("pal_3")).toEqual(["chikipi_alpha"]);
    expect(lookup("pal_2")).toEqual([]);
  });
});
