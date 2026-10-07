import {
  creatureModifiers,
  damageMultiplier,
  damagePercent,
  formatDamagePercent,
  sortCreaturesByType,
  weaknessLevel,
  weaponsDealing,
  type WeaknessData,
} from "./weakness-chart";

// Shape of Grounded 2's config/weaknesses.json (values from the game files).
const DATA: WeaknessData = {
  types: [
    { id: "smashing", entry: "damage_types_smashing" },
    { id: "stabbing", entry: "damage_types_stabbing" },
    { id: "fresh", entry: "damage_types_fresh" },
    { id: "spicy", entry: "damage_types_spicy" },
    { id: "venom", entry: "damage_types_venom" },
  ],
  creatures: {
    creatures_Ladybug: {
      smashing: 1.15,
      stabbing: 0.75,
      fresh: 1.3,
      spicy: 0.75,
    },
    creatures_SpiderOrb: {
      fresh: 0.75,
      spicy: 1.3,
      stabbing: 0.75,
      venom: 0.5,
    },
    creatures_Aphid: {},
  },
  weapons: {
    weapons_Spear: ["stabbing"],
    weapons_AntClub: ["smashing"],
    weapons_StaffMintTier2: ["fresh"],
    weapons_KatanaSpicy: ["slashing", "spicy"],
  },
};

const names: Record<string, string> = {
  creatures_Ladybug: "Ladybug",
  creatures_SpiderOrb: "Orb Weaver",
  creatures_Aphid: "Aphid",
};
const nameOf = (id: string) => names[id] ?? id;

describe("weakness chart", () => {
  it("reads multipliers with 1 as the default", () => {
    expect(damageMultiplier(DATA, "creatures_Ladybug", "fresh")).toBe(1.3);
    expect(damageMultiplier(DATA, "creatures_Aphid", "fresh")).toBe(1);
    expect(damageMultiplier(DATA, "creatures_Unknown", "fresh")).toBe(1);
  });

  it("formats signed percentages", () => {
    expect(damagePercent(1.3)).toBe(30);
    expect(damagePercent(0.75)).toBe(-25);
    expect(damagePercent(0.1)).toBe(-90);
    expect(damagePercent(1.15)).toBe(15);
    expect(formatDamagePercent(1.3)).toBe("+30%");
    expect(formatDamagePercent(0.5)).toBe("−50%");
    expect(formatDamagePercent(1)).toBe("");
  });

  it("bands values for colouring", () => {
    expect(weaknessLevel(1.3)).toBe("very-weak");
    expect(weaknessLevel(1.15)).toBe("weak");
    expect(weaknessLevel(1)).toBe("normal");
    expect(weaknessLevel(0.75)).toBe("resistant");
    expect(weaknessLevel(0.5)).toBe("very-resistant");
  });

  it("orders weaknesses most-damage first and resistances least-damage first", () => {
    const m = creatureModifiers(DATA, "creatures_SpiderOrb");
    expect(m.weaknesses).toEqual([["spicy", 1.3]]);
    expect(m.resistances.map(([t]) => t)).toEqual([
      "venom",
      "stabbing",
      "fresh",
    ]);
    const l = creatureModifiers(DATA, "creatures_Ladybug");
    expect(l.weaknesses.map(([t]) => t)).toEqual(["fresh", "smashing"]);
    expect(creatureModifiers(DATA, "creatures_Aphid")).toEqual({
      weaknesses: [],
      resistances: [],
    });
  });

  it("sorts creatures by a damage type column", () => {
    const ids = Object.keys(DATA.creatures);
    expect(sortCreaturesByType(DATA, ids, "fresh", nameOf)).toEqual([
      "creatures_Ladybug",
      "creatures_Aphid",
      "creatures_SpiderOrb",
    ]);
    expect(sortCreaturesByType(DATA, ids, "fresh", nameOf, false)).toEqual([
      "creatures_SpiderOrb",
      "creatures_Aphid",
      "creatures_Ladybug",
    ]);
    // Ties fall back to the name.
    expect(sortCreaturesByType(DATA, ids, "venom", nameOf, true)[0]).toBe(
      "creatures_Aphid",
    );
  });

  it("finds weapons dealing a damage type", () => {
    expect(weaponsDealing(DATA, ["spicy"])).toEqual(["weapons_KatanaSpicy"]);
    expect(weaponsDealing(DATA, ["fresh", "smashing"]).sort()).toEqual([
      "weapons_AntClub",
      "weapons_StaffMintTier2",
    ]);
    expect(weaponsDealing({ ...DATA, weapons: undefined }, ["fresh"])).toEqual(
      [],
    );
  });
});
