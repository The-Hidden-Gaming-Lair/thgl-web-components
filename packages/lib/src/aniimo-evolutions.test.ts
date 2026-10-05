import {
  evolutionBranch,
  evolutionCost,
  evolutionItemIds,
  evolutionLineOf,
  evolutionPath,
  type EvolutionsData,
} from "./aniimo-evolutions";

// Pebbling → Lavazar → Magmarex, Pebbling → Geodeback (two branches), Eko alone.
const DATA: EvolutionsData = {
  lines: [
    {
      id: "pebbling",
      species: ["pebbling", "lavazar", "magmarex", "geodeback"],
    },
  ],
  species: {
    pebbling: {
      stage: 1,
      from: [],
      evolutions: [
        { to: "lavazar", level: 38, conditions: [], items: [] },
        {
          to: "geodeback",
          level: 38,
          conditions: [],
          items: [{ id: "loam", count: 1, alt: { id: "dew", count: 1 } }],
        },
      ],
    },
    lavazar: {
      stage: 2,
      from: ["pebbling"],
      evolutions: [
        {
          to: "magmarex",
          level: 48,
          unlock: "evolutions.cond.1",
          conditions: ["evolutions.cond.2"],
          items: [{ id: "blaze", count: 1, alt: { id: "dew", count: 1 } }],
        },
      ],
    },
    magmarex: { stage: 3, from: ["lavazar"], evolutions: [] },
    geodeback: { stage: 2, from: ["pebbling"], evolutions: [] },
    eko: { stage: 1, from: [], evolutions: [] },
  },
};

describe("aniimo evolutions", () => {
  it("finds the line of every member and none for a lone species", () => {
    expect(evolutionLineOf(DATA, "magmarex")?.id).toBe("pebbling");
    expect(evolutionLineOf(DATA, "eko")).toBeUndefined();
  });

  it("walks the path from the root", () => {
    expect(evolutionPath(DATA, "magmarex")).toEqual([
      "pebbling",
      "lavazar",
      "magmarex",
    ]);
    expect(evolutionPath(DATA, "pebbling")).toEqual(["pebbling"]);
  });

  it("returns the branch between two stages", () => {
    expect(evolutionBranch(DATA, "lavazar", "magmarex")?.level).toBe(48);
    expect(evolutionBranch(DATA, "pebbling", "magmarex")).toBeUndefined();
  });

  it("sums the cost along the path without counting substitutes", () => {
    expect(evolutionCost(DATA, "magmarex")).toEqual({
      steps: 2,
      level: 48,
      items: [{ id: "blaze", count: 1 }],
    });
    expect(evolutionCost(DATA, "eko")).toEqual({
      steps: 0,
      level: undefined,
      items: [],
    });
  });

  it("collects every stone and substitute once", () => {
    expect(evolutionItemIds(DATA).sort()).toEqual(["blaze", "dew", "loam"]);
  });

  it("stops on a cycle instead of looping", () => {
    const loop: EvolutionsData = {
      lines: [],
      species: {
        a: { from: ["b"], evolutions: [] },
        b: { from: ["a"], evolutions: [] },
      },
    };
    expect(evolutionPath(loop, "a")).toEqual(["b", "a"]);
  });
});
