import {
  blueprintStarCost,
  decodeBlueprintPlan,
  encodeBlueprintPlan,
  planBlueprints,
  type OnceHumanBlueprintData,
} from "./once-human-blueprints";

// Rows from config/blueprints.json (Once Human 3.0.7).
const DATA: OnceHumanBlueprintData = {
  currency: { id: "money_1001", name: "Starchrom" },
  rarities: { "1": "Common", "3": "Epic", "4": "Legendary" },
  blueprints: {
    // Legendary weapon: 8000 unlock, 3000..15000 per star.
    "13112301": {
      kind: "weapon",
      rarity: 4,
      costs: [8000, 3000, 6000, 9000, 12000, 15000],
      fragments: 80,
      gear: [{ id: "10112301", tier: 1 }],
    },
    // Warning Sign (Epic melee).
    "13930301": {
      kind: "weapon",
      rarity: 3,
      costs: [2000, 750, 1500, 2250, 3000],
      fragments: 40,
      gear: [],
    },
    // Common armor.
    "22300101": {
      kind: "armor",
      rarity: 1,
      costs: [30, 30, 60],
      fragments: 0,
      gear: [],
    },
  },
};

describe("once-human blueprints", () => {
  it("prices unlock + every star gained", () => {
    expect(blueprintStarCost(DATA.blueprints["13112301"]!, 0, 6)).toEqual([
      { star: 1, cost: 8000 },
      { star: 2, cost: 3000 },
      { star: 3, cost: 6000 },
      { star: 4, cost: 9000 },
      { star: 5, cost: 12000 },
      { star: 6, cost: 15000 },
    ]);
    expect(blueprintStarCost(DATA.blueprints["13930301"]!, 3, 5)).toEqual([
      { star: 4, cost: 2250 },
      { star: 5, cost: 3000 },
    ]);
  });

  it("clamps stars to the blueprint's max and never goes down", () => {
    const { lines, total } = planBlueprints(DATA, [
      { id: "22300101", from: 1, to: 9 },
      { id: "13930301", from: 4, to: 2 },
      { id: "unknown", from: 0, to: 3 },
    ]);
    expect(lines.map((l) => [l.id, l.from, l.to, l.cost])).toEqual([
      ["22300101", 1, 3, 90],
      ["13930301", 4, 4, 0],
    ]);
    expect(total).toBe(90);
  });

  it("sums a multi-blueprint plan", () => {
    const { total } = planBlueprints(DATA, [
      { id: "13112301", from: 0, to: 6 },
      { id: "13930301", from: 1, to: 5 },
    ]);
    expect(total).toBe(53000 + 7500);
  });

  it("round-trips the share-URL form and drops junk", () => {
    const plan = [
      { id: "13112301", from: 2, to: 6 },
      { id: "22300101", from: 0, to: 3 },
    ];
    expect(decodeBlueprintPlan(DATA, encodeBlueprintPlan(plan))).toEqual(plan);
    expect(
      decodeBlueprintPlan(DATA, "13112301.9.1,nope.0.1,13112301.0.2,x"),
    ).toEqual([{ id: "13112301", from: 6, to: 6 }]);
    expect(decodeBlueprintPlan(DATA, null)).toEqual([]);
  });
});
