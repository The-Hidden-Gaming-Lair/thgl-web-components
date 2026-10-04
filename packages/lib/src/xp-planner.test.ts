import { buildCraftingGraph, type CraftDbCategory } from "./crafting";
import {
  actionsNeeded,
  clampLevel,
  formatXpPlannerState,
  groupMethods,
  levelForXp,
  levelProgress,
  methodCost,
  methodInputs,
  methodsForSkill,
  parseXpPlannerState,
  stateXp,
  trainableSkills,
  xpBetweenLevels,
  xpForLevel,
  xpToLevel,
  type XpConfig,
} from "./xp-planner";

// The first and last levels of RuneScape: Dragonwilds' live curve
// (CT_XPByLevel XPByLevel_011), padded with a smooth middle.
const CURVE = [0, 33, 70, 111, 156, 206, 261, 322, 389, 463];

const CONFIG: XpConfig = {
  v: 1,
  maxLevel: 10,
  curve: CURVE,
  skills: [
    { id: "mining", name: "xp:skill.mining" },
    { id: "artisan", name: "xp:skill.artisan" },
    { id: "construction", name: "xp:skill.construction" },
    { id: "thieving", name: "xp:skill.thieving" },
  ],
  methods: [
    {
      id: "mine.copper",
      skill: "mining",
      kind: "mine",
      xp: 23,
      unit: "ore",
      name: "xp:node.copper",
      flag: "approx",
    },
    {
      id: "mine.coal",
      skill: "mining",
      kind: "mine",
      xp: 67.5,
      unit: "ore",
      name: "xp:node.coal",
    },
    {
      id: "read.tome",
      skill: "mining",
      kind: "read",
      xp: 100,
      unit: "read",
      name: "item_tome",
    },
    {
      id: "craft.bar",
      skill: "artisan",
      kind: "craft",
      xp: 5,
      unit: "craft",
      name: "recipe_bar",
      recipe: "recipe_bar",
    },
    {
      id: "craft.bar_alt",
      skill: "artisan",
      kind: "craft",
      xp: 5,
      unit: "craft",
      name: "recipe_bar_alt",
      recipe: "recipe_bar_alt",
    },
    {
      id: "craft.plank",
      skill: "artisan",
      kind: "craft",
      xp: 12,
      unit: "craft",
      name: "recipe_plank",
      recipe: "recipe_plank",
    },
    {
      id: "build.chair",
      skill: "construction",
      kind: "build",
      xp: 40,
      unit: "build",
      name: "xp:build.chair",
      items: [{ id: "plank", section: "items", count: 4 }],
    },
  ],
};

const ref = (id: string, count?: number, section = "items") => ({
  id,
  section,
  ...(count ? { count } : {}),
});

const DB: CraftDbCategory[] = [
  {
    type: "items",
    items: [{ id: "ore" }, { id: "bar" }, { id: "log" }, { id: "plank" }],
  },
  {
    type: "recipes",
    items: [
      {
        id: "recipe_bar",
        props: { ingredients: [ref("ore", 2)], products: [ref("bar")] },
      },
      {
        id: "recipe_bar_alt",
        props: {
          ingredients: [ref("ore", 3)],
          products: [ref("bar", 2)],
          Alternate: "Yes",
        },
      },
      {
        id: "recipe_plank",
        props: { ingredients: [ref("log", 1)], products: [ref("plank", 2)] },
      },
    ],
  },
];

describe("level curve", () => {
  it("looks up XP per level and clamps", () => {
    expect(xpForLevel(CURVE, 1)).toBe(0);
    expect(xpForLevel(CURVE, 2)).toBe(33);
    expect(xpForLevel(CURVE, 10)).toBe(463);
    expect(xpForLevel(CURVE, 99)).toBe(463);
    expect(xpForLevel(CURVE, 0)).toBe(0);
    expect(clampLevel(CURVE, Number.NaN)).toBe(1);
    expect(clampLevel(CURVE, 4.7)).toBe(4);
  });

  it("finds the level for a total XP (thresholds are inclusive)", () => {
    expect(levelForXp(CURVE, 0)).toBe(1);
    expect(levelForXp(CURVE, 32)).toBe(1);
    expect(levelForXp(CURVE, 33)).toBe(2);
    expect(levelForXp(CURVE, 462)).toBe(9);
    expect(levelForXp(CURVE, 463)).toBe(10);
    expect(levelForXp(CURVE, 1e9)).toBe(10);
    expect(levelForXp(CURVE, -5)).toBe(1);
  });

  it("computes XP between levels and to a target", () => {
    expect(xpBetweenLevels(CURVE, 1, 10)).toBe(463);
    expect(xpBetweenLevels(CURVE, 3, 5)).toBe(156 - 70);
    expect(xpBetweenLevels(CURVE, 5, 3)).toBe(0);
    expect(xpToLevel(CURVE, 100, 5)).toBe(56);
    expect(xpToLevel(CURVE, 500, 5)).toBe(0);
    // Fractional XP (mining 67.5 per ore) still needs whole XP to cross.
    expect(xpToLevel(CURVE, 32.5, 2)).toBe(1);
  });

  it("reports progress inside a level", () => {
    expect(levelProgress(CURVE, 33)).toBe(0);
    expect(levelProgress(CURVE, (33 + 70) / 2)).toBeCloseTo(0.5);
    expect(levelProgress(CURVE, 463)).toBe(1);
  });
});

describe("actions", () => {
  it("rounds up to whole actions", () => {
    expect(actionsNeeded(463, 23)).toBe(21); // 20.13 → 21
    expect(actionsNeeded(460, 23)).toBe(20); // exact
    expect(actionsNeeded(0, 23)).toBe(0);
    expect(actionsNeeded(10, 0)).toBe(Infinity);
  });

  it("does not add an action for float noise", () => {
    // 0.1 × 30 is 3.0000000000000004 in floating point.
    expect(actionsNeeded(0.1 * 30, 0.1)).toBe(30);
    expect(actionsNeeded(463, 67.5)).toBe(7); // 6.86 → 7
  });
});

describe("methods", () => {
  it("lists a skill's methods best first and groups by kind", () => {
    expect(methodsForSkill(CONFIG, "mining").map((m) => m.id)).toEqual([
      "read.tome",
      "mine.coal",
      "mine.copper",
    ]);
    expect(
      groupMethods(methodsForSkill(CONFIG, "mining")).map((g) => [
        g.kind,
        g.methods.length,
      ]),
    ).toEqual([
      ["read", 1],
      ["mine", 2],
    ]);
  });

  it("hides skills without methods", () => {
    expect(trainableSkills(CONFIG).map((s) => s.id)).toEqual([
      "mining",
      "artisan",
      "construction",
    ]);
  });
});

describe("cost via the crafting graph", () => {
  const graph = buildCraftingGraph(DB);

  it("costs N crafts of the method's own recipe", () => {
    const bar = CONFIG.methods.find((m) => m.id === "craft.bar")!;
    const plan = methodCost(graph, bar, 7)!;
    expect(plan.raw).toEqual([{ id: "ore", section: "items", qty: 14 }]);
    expect(plan.crafted[0]).toMatchObject({ id: "bar", crafts: 7 });
  });

  it("forces an alternate recipe and its yield", () => {
    const alt = CONFIG.methods.find((m) => m.id === "craft.bar_alt")!;
    const plan = methodCost(graph, alt, 4)!;
    // 4 crafts of 3 ore → 2 bars each.
    expect(plan.crafted[0]).toMatchObject({
      id: "bar",
      crafts: 4,
      produced: 8,
    });
    expect(plan.raw).toEqual([{ id: "ore", section: "items", qty: 12 }]);
  });

  it("costs material lists (building pieces) through sub-recipes", () => {
    const chair = CONFIG.methods.find((m) => m.id === "build.chair")!;
    const plan = methodCost(graph, chair, 3)!;
    // 3 chairs × 4 planks = 12 planks = 6 crafts of 1 log.
    expect(plan.raw).toEqual([{ id: "log", section: "items", qty: 6 }]);
    expect(methodInputs(graph, chair)).toEqual(chair.items);
    expect(
      methodInputs(graph, CONFIG.methods.find((m) => m.id === "craft.plank")!),
    ).toEqual([{ id: "log", section: "items", count: 1 }]);
  });

  it("returns null without a cost", () => {
    const coal = CONFIG.methods.find((m) => m.id === "mine.coal")!;
    expect(methodCost(graph, coal, 5)).toBeNull();
    expect(methodCost(null, CONFIG.methods[3], 5)).toBeNull();
    expect(methodCost(graph, CONFIG.methods[3], Infinity)).toBeNull();
  });
});

describe("share URL state", () => {
  const params = (q: string) => new URLSearchParams(q);

  it("round-trips level, xp, target and method", () => {
    const s = parseXpPlannerState(
      CONFIG,
      params("skill=mining&from=3&to=8&m=mine.coal"),
    );
    expect(s).toEqual({
      skill: "mining",
      from: 3,
      xp: undefined,
      to: 8,
      method: "mine.coal",
    });
    expect(formatXpPlannerState(s)).toBe(
      "skill=mining&from=3&to=8&m=mine.coal",
    );
    expect(stateXp(CURVE, s)).toBe(70);
  });

  it("prefers exact XP and derives the level from it", () => {
    const s = parseXpPlannerState(CONFIG, params("skill=mining&xp=120&to=9"));
    expect(s.from).toBe(4);
    expect(stateXp(CURVE, s)).toBe(120);
    expect(formatXpPlannerState(s, { includeSkill: false })).toBe(
      "xp=120&to=9",
    );
  });

  it("drops unknown skills / methods and clamps levels", () => {
    const s = parseXpPlannerState(
      CONFIG,
      params("skill=nope&from=0&to=500&m=craft.bar"),
      "mining",
    );
    expect(s.skill).toBe("mining");
    expect(s.from).toBe(1);
    expect(s.to).toBe(10);
    expect(s.method).toBeUndefined(); // craft.bar is not a mining method
  });

  it("defaults the target to the next level", () => {
    expect(parseXpPlannerState(CONFIG, params("from=4")).to).toBe(5);
    expect(parseXpPlannerState(CONFIG, params("from=10")).to).toBe(10);
  });
});
