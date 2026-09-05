import {
  parseImportedFilter,
  repairMisimportedFilter,
  repairMisimportedFilters,
} from "./filter-import";
import type { DrawingsAndNodes } from "./settings";

const NOW = 1_700_000_000_000;

// A real synced export, trimmed: the exact shape that regressed — a modern
// filter carrying a server `id` and no `filter` key, which the legacy-drawing
// test used to swallow whole.
const syncedExport = {
  name: "my_1786444195423_Nasze Bazy",
  id: "426377e3-a28a-4b4b-9571-12bea9d00cfb",
  game: "dune-awakening",
  synced: true,
  visibility: "private",
  shareCode: "fk3Az7YdRJ6W",
  updatedAt: 1788468034,
  nodes: [
    {
      id: "n1",
      name: "Główna Baza",
      icon: {
        url: "/icons/icons.webp",
        x: 398,
        y: 398,
        width: 64,
        height: 64,
        name: "Base",
        filterId: "structurevendor",
      },
      radius: 22,
      p: [-10611.57, 83284.71],
      mapName: "survival_1",
    },
  ],
};

describe("parseImportedFilter", () => {
  it("keeps the nodes of a synced filter export (the regression)", () => {
    // Before: `data.id && !data.filter` matched first, so the whole object was
    // wrapped into `drawing` and every node was lost — the import "succeeded"
    // and the map stayed empty.
    const out = parseImportedFilter(syncedExport, "", NOW);
    expect(out.nodes).toHaveLength(1);
    expect(out.nodes![0].name).toBe("Główna Baza");
    expect(out.drawing).toBeUndefined();
  });

  it("strips server identity so the import can't write to the owner's row", () => {
    const out = parseImportedFilter(syncedExport, "", NOW) as Record<
      string,
      unknown
    >;
    expect(out.id).toBeUndefined();
    expect(out.shareCode).toBeUndefined();
    expect(out.visibility).toBeUndefined();
    expect(out.synced).toBeUndefined();
  });

  it("re-stamps the name so a re-import doesn't collide with the original", () => {
    const out = parseImportedFilter(syncedExport, "", NOW);
    expect(out.name).toBe(`my_${NOW}_Nasze Bazy`);
  });

  it("does not mutate the caller's parsed JSON", () => {
    const input = JSON.parse(JSON.stringify(syncedExport));
    parseImportedFilter(input, "", NOW);
    expect(input.id).toBe("426377e3-a28a-4b4b-9571-12bea9d00cfb");
    expect(input.name).toBe("my_1786444195423_Nasze Bazy");
  });

  it("accepts an unsynced export (no server id) too", () => {
    const out = parseImportedFilter(
      { name: "my_1_Bases", nodes: [{ id: "a" }] },
      "",
      NOW,
    );
    expect(out.nodes).toHaveLength(1);
    expect(out.name).toBe(`my_${NOW}_Bases`);
  });

  it("treats a drawing-only filter export as a filter, not a legacy drawing", () => {
    const out = parseImportedFilter(
      { name: "my_1_Route", id: "srv", drawing: { id: "d1", polylines: [] } },
      "",
      NOW,
    );
    expect(out.drawing).toEqual({ id: "d1", polylines: [] });
    expect(out.id).toBeUndefined();
  });

  describe("legacy shapes still work", () => {
    it("wraps a bare drawing and converts positions to polylines", () => {
      const out = parseImportedFilter(
        {
          id: "d1",
          name: "Route",
          types: ["x"],
          positions: [[{ position: [1, 2] }, { position: [3, 4] }]],
        },
        "Map1",
        NOW,
      );
      expect(out.nodes).toBeUndefined();
      const drawing = out.drawing as unknown as Record<string, unknown>;
      expect(drawing.polylines).toEqual([
        {
          positions: [
            [1, 2],
            [3, 4],
          ],
          size: 4,
          color: "#FFFFFFAA",
          mapName: "Map1",
        },
      ]);
      expect(drawing.positions).toBeUndefined();
      expect(drawing.types).toBeUndefined();
      expect(drawing.name).toBeUndefined();
      expect(out.name).toBe(`my_${NOW}_Route`);
    });

    it("wraps a bare node array and drops each node's legacy filter field", () => {
      const out = parseImportedFilter(
        [
          { id: "n1", filter: "private_Bases" },
          { id: "n2", filter: "private_Bases" },
        ],
        "",
        NOW,
      );
      expect(out.nodes).toHaveLength(2);
      expect(out.name).toBe(`my_${NOW}_Bases`);
      expect((out.nodes![0] as Record<string, unknown>).filter).toBeUndefined();
    });
  });

  describe("repairing an already-botched import", () => {
    // Exactly what the old code produced for a synced export: the whole parsed
    // object (minus its name) assigned to `drawing`. The nodes were never lost,
    // just parked where the map doesn't draw markers.
    const botched = {
      name: "my_1788469000000_Nasze Bazy",
      drawing: {
        id: "426377e3-a28a-4b4b-9571-12bea9d00cfb",
        game: "dune-awakening",
        synced: true,
        shareCode: "fk3Az7YdRJ6W",
        nodes: syncedExport.nodes,
      },
    } as unknown as DrawingsAndNodes;

    it("unwraps the nodes and drops the bogus drawing", () => {
      const out = repairMisimportedFilter(botched);
      expect(out.nodes).toHaveLength(1);
      expect(out.nodes![0].name).toBe("Główna Baza");
      expect(out.drawing).toBeUndefined();
      expect(out.name).toBe("my_1788469000000_Nasze Bazy");
    });

    it("does not resurrect the wrapped server identity", () => {
      const out = repairMisimportedFilter(botched) as Record<string, unknown>;
      expect(out.id).toBeUndefined();
      expect(out.shareCode).toBeUndefined();
    });

    it("keeps a real drawing that was wrapped alongside the nodes", () => {
      const withInner = {
        name: "f",
        drawing: { nodes: [{ id: "n" }], drawing: { id: "d1", polylines: [] } },
      } as unknown as DrawingsAndNodes;
      const out = repairMisimportedFilter(withInner);
      expect(out.nodes).toHaveLength(1);
      expect(out.drawing).toEqual({ id: "d1", polylines: [] });
    });

    it("never touches a genuine drawing (a Drawing has no `nodes`)", () => {
      const real = {
        name: "route",
        drawing: { id: "d1", polylines: [], texts: [] },
      } as unknown as DrawingsAndNodes;
      expect(repairMisimportedFilter(real)).toBe(real);
    });

    it("leaves a filter that already has its own nodes alone", () => {
      const both = {
        name: "f",
        nodes: [{ id: "outer" }],
        drawing: { nodes: [{ id: "inner" }] },
      } as unknown as DrawingsAndNodes;
      expect(repairMisimportedFilter(both)).toBe(both);
    });

    it("repairMisimportedFilters keeps array identity when nothing to heal", () => {
      const clean = [{ name: "a" }, { name: "b" }] as DrawingsAndNodes[];
      expect(repairMisimportedFilters(clean)).toBe(clean);
      const mixed = [clean[0], botched];
      const out = repairMisimportedFilters(mixed);
      expect(out).not.toBe(mixed);
      expect(out[1].nodes).toHaveLength(1);
    });
  });

  describe("rejects junk", () => {
    it.each([
      ["null", null],
      ["a string", "nope"],
      ["an empty array", []],
      ["an array of node-less objects", [{ foo: 1 }]],
      ["an object with neither nodes, drawing nor id", { name: "x" }],
    ])("throws on %s", (_label, input) => {
      expect(() => parseImportedFilter(input, "", NOW)).toThrow(
        "Invalid filter",
      );
    });
  });
});
