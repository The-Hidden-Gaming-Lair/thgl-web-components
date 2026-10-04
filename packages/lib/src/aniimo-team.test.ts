import {
  decodeTeam,
  defenseProfile,
  encodeTeam,
  offenseCoverage,
  partnersFor,
  rankCounters,
  recommendedTeam,
  sharedWeaknesses,
  suggestNext,
  summarizeTeam,
  type TeamBuilderData,
} from "./aniimo-team";

const skill = (id: string, element: string, power: number, type = 3) => ({
  id,
  element,
  type,
  power,
});

// Rock-paper-scissors chart: Fire > Grass > Water > Fire.
const DATA: TeamBuilderData = {
  elements: [{ id: "Fire" }, { id: "Water" }, { id: "Grass" }],
  chart: {
    Fire: { Fire: 0.625, Water: 0.625, Grass: 1.6 },
    Water: { Fire: 1.6, Water: 0.625, Grass: 0.625 },
    Grass: { Fire: 0.625, Water: 1.6, Grass: 0.625 },
  },
  roles: [{ id: "DPS" }, { id: "HEAL" }],
  damageSkillTypes: [0, 3, 4],
  species: {
    ember: {
      main: "Fire",
      elements: ["Fire"],
      role: "DPS",
      stats: [80, 100, 60, 50, 50],
      skills: [skill("s_fire", "Fire", 60), skill("s_passive", "Fire", 0, 1)],
    },
    drop: {
      main: "Water",
      elements: ["Water"],
      role: "HEAL",
      stats: [90, 50, 70, 60, 60],
      skills: [skill("s_water", "Water", 50)],
    },
    leaf: {
      main: "Grass",
      elements: ["Grass", "Water"],
      role: "DPS",
      stats: [70, 90, 90, 40, 40],
      skills: [skill("s_grass", "Grass", 70), skill("s_water2", "Water", 40)],
    },
    blaze: {
      main: "Fire",
      elements: ["Fire"],
      role: "DPS",
      stats: [60, 60, 60, 60, 60],
      skills: [skill("s_fire2", "Fire", 90)],
    },
  },
  recommended: [
    { element: "Fire", roles: { DPS: ["blaze", "ember"], HEAL: ["drop"] } },
  ],
};

describe("aniimo team builder", () => {
  it("finds the best multiplier per defending element and who delivers it", () => {
    const cov = offenseCoverage(DATA, [{ id: "ember" }, { id: "drop" }]);
    expect(cov.find((c) => c.element === "Grass")).toMatchObject({
      multiplier: 1.6,
      by: [{ member: "ember", skill: "s_fire" }],
    });
    expect(cov.find((c) => c.element === "Fire")?.multiplier).toBe(1.6);
    // Nothing in this team hits Water super-effectively; best is resisted.
    expect(cov.find((c) => c.element === "Water")?.multiplier).toBe(0.625);
  });

  it("ignores switched-off and non-damaging skills", () => {
    const cov = offenseCoverage(DATA, [{ id: "leaf", off: ["s_grass"] }]);
    expect(cov.find((c) => c.element === "Water")?.multiplier).toBe(0.625);
    expect(cov.find((c) => c.element === "Fire")?.multiplier).toBe(1.6);
  });

  it("checks incoming damage against the MAIN element only", () => {
    // leaf is Grass main with a Water affinity: Fire still hits it for 1.6.
    const rows = defenseProfile(DATA, [{ id: "leaf" }]);
    expect(rows.find((r) => r.element === "Fire")?.taken).toEqual([1.6]);
    expect(rows.find((r) => r.element === "Grass")?.taken).toEqual([0.625]);
  });

  it("flags elements that hit two or more members", () => {
    expect(sharedWeaknesses(DATA, [{ id: "ember" }, { id: "blaze" }])).toEqual([
      "Water",
    ]);
  });

  it("summarizes coverage, roles and stats", () => {
    const s = summarizeTeam(DATA, [{ id: "ember" }, { id: "blaze" }]);
    expect(s.superEffective).toEqual(["Grass"]);
    expect(s.missingRoles).toEqual(["HEAL"]);
    expect(s.stats[0]).toBe(140);
  });

  it("ranks counters: super-effective first, then least damage taken", () => {
    const ranked = rankCounters(DATA, "Fire").map((c) => c.id);
    // Water attackers win; drop (Water main, resists Fire) beats leaf (Grass main, weak to Fire).
    expect(ranked.slice(0, 2)).toEqual(["drop", "leaf"]);
  });

  it("suggests picks that add coverage and fill missing roles", () => {
    const [first] = suggestNext(DATA, [{ id: "ember" }, { id: "blaze" }]);
    expect(first?.id).toBe("drop");
    expect(first?.fillsRole).toBe("HEAL");
    expect(first?.covers).toContain("Fire");
  });

  it("finds partners that resist a species' weaknesses", () => {
    // ember (Fire) is weak to Water; Water-main drop and Grass-main leaf resist it,
    // the Fire-main blaze does not.
    expect(partnersFor(DATA, "ember")).toEqual([
      { id: "drop", resists: ["Water"] },
      { id: "leaf", resists: ["Water"] },
    ]);
  });

  it("round-trips the share URL and drops unknown ids and skills", () => {
    const team = [{ id: "ember" }, { id: "leaf", off: ["s_grass"] }];
    expect(decodeTeam(DATA, encodeTeam(team))).toEqual(team);
    expect(decodeTeam(DATA, "nope,ember!bogus,ember")).toEqual([
      { id: "ember" },
    ]);
  });

  it("builds the game's recommended team in role order", () => {
    expect(recommendedTeam(DATA, "Fire")).toEqual([
      { id: "blaze" },
      { id: "drop" },
    ]);
  });
});
