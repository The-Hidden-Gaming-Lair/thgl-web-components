import {
  createBreeder,
  findBreedingPlan,
  type BreedingData,
  type BreedingPal,
} from "./palworld-breeding";

const pal = (
  rank: number,
  priority: number,
  extra: Partial<BreedingPal> = {},
): BreedingPal => ({
  key: "",
  tribe: "",
  rank,
  priority,
  male: 50,
  rarity: 1,
  elements: [],
  dex: "1",
  ...extra,
});

const DATA: BreedingData = {
  pals: {
    low: pal(100, 10000),
    mid: pal(500, 50000),
    mid_variant: pal(500, 50000, { variant: true }),
    high: pal(900, 90000),
    tie_a: pal(300, 30000),
    tie_b: pal(310, 31000),
    legend: pal(50, 5000, { ignore: true }),
    katress: pal(700, 70000),
    wixen: pal(710, 71000),
    noct: pal(705, 70500),
    ignis: pal(706, 70600),
  },
  unique: [
    ["katress", "m", "wixen", "f", "noct"],
    ["katress", "f", "wixen", "m", "ignis"],
  ],
  settings: {
    passiveInheritWeights: [],
    passiveRandomAddWeights: [],
    talentInheritWeights: [],
    bossRate: 0,
    eggRanks: [],
  },
  cakes: [],
};

describe("palworld breeding", () => {
  const breeder = createBreeder(DATA);
  const child = (a: string, b: string) =>
    breeder.breed(a, b).map((o) => o.child);

  it("same species breeds itself", () => {
    expect(breeder.breed("legend", "legend")).toEqual([
      { child: "legend", via: "same" },
    ]);
  });

  it("picks the closest rank to floor((a+b+1)/2)", () => {
    // (100 + 900 + 1) / 2 = 500 → mid (non-variant wins the equal-priority tie)
    expect(breeder.targetRank("low", "high")).toBe(500);
    expect(child("low", "high")).toEqual(["mid"]);
  });

  it("breaks equal distance by the higher duplicate priority", () => {
    // (100 + 510 + 1) / 2 = 305 → tie_a (5 away) vs tie_b (5 away) → tie_b
    const data: BreedingData = {
      ...DATA,
      pals: { ...DATA.pals, p510: pal(510, 1) },
    };
    expect(createBreeder(data).breed("low", "p510")[0].child).toBe("tie_b");
  });

  it("never produces IgnoreCombi or unique-combo children by rank", () => {
    // (50 + 100 + 1) / 2 = 75 → legend is closest but ignored → low
    expect(child("legend", "low")).toEqual(["low"]);
    // (700 + 710 + 1) / 2 = 705 would be noct, but noct is unique-only
    const ids = breeder
      .allPairs()
      .filter((p) => p.outcome.via === "rank")
      .map((p) => p.outcome.child);
    expect(ids).not.toContain("noct");
    expect(ids).not.toContain("ignis");
    expect(ids).not.toContain("legend");
  });

  it("returns both outcomes of a gendered unique combo, genders aligned to the call order", () => {
    expect(breeder.breed("wixen", "katress")).toEqual([
      { child: "noct", via: "unique", genders: ["f", "m"] },
      { child: "ignis", via: "unique", genders: ["m", "f"] },
    ]);
  });

  it("lists every parent pair of a child", () => {
    const pairs = breeder.parentsOf("mid").map((p) => `${p.a}+${p.b}`);
    expect(pairs).toContain("low+high");
    expect(pairs).toContain("mid+mid");
  });

  it("plans the cheapest path in expected eggs", () => {
    expect(findBreedingPlan(breeder, ["low"], "low")).toEqual({
      target: "low",
      eggs: 0,
      steps: [],
    });
    const plan = findBreedingPlan(breeder, ["low", "high"], "mid")!;
    expect(plan.eggs).toBe(1);
    expect(plan.steps.map((s) => s.child)).toEqual(["mid"]);
    // A gender-gated combo from owned parents still costs one egg.
    expect(findBreedingPlan(breeder, ["katress", "wixen"], "noct")!.eggs).toBe(
      1,
    );
    // Unreachable: the only owned pal breeds itself.
    expect(findBreedingPlan(breeder, ["low"], "high")).toBeNull();
  });
});
