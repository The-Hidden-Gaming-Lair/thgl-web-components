import {
  findTalents,
  palStat,
  palStats,
  type PalStatInput,
  type PalStatsData,
} from "./palworld-stats";

// Rows + settings from config/stats.json (build 25246127).
const DATA: PalStatsData = {
  settings: {
    hpLevelMul: 0.5,
    hpLevelAdd: 10,
    hpConst: 500,
    attackLevelMul: 0.075,
    attackConst: 100,
    defenseLevelMul: 0.075,
    defenseConst: 50,
    talentRate: 0.003,
    condenserRate: 0.05,
    statueRate: 0.03,
    passiveRate: 0.01,
    maxLevel: 80,
    maxCondenserRank: 5,
    maxStatueRank: 20,
    maxTrustRank: 10,
    maxTalent: 100,
  },
  pals: {
    pal_windchimes: {
      dex: "1",
      hp: 80,
      attack: 70,
      defense: 70,
      trust: [5, 3.7, 3.7],
      alpha: { hp: 96, attack: 70, defense: 70, trust: [4.2, 3.7, 3.7] },
    },
    pal_deer: {
      dex: "1",
      hp: 95,
      attack: 80,
      defense: 80,
      trust: [4.3, 3.3, 3.3],
      alpha: { hp: 114, attack: 80, defense: 80, trust: [3.3, 3.3, 3.3] },
    },
    pal_hadesbird: {
      dex: "1",
      hp: 100,
      attack: 125,
      defense: 100,
      trust: [4, 1.5, 2.5],
      alpha: { hp: 120, attack: 125, defense: 100, trust: [3, 1.5, 2.5] },
    },
    pal_weaseldragon: {
      dex: "1",
      hp: 90,
      attack: 80,
      defense: 80,
      trust: [4.5, 3.3, 3.3],
      alpha: { hp: 108, attack: 80, defense: 80, trust: [3.6, 3.3, 3.3] },
    },
    pal_leafmomonga: {
      dex: "1",
      hp: 80,
      attack: 75,
      defense: 75,
      trust: [5, 3.5, 3.5],
      alpha: { hp: 96, attack: 75, defense: 75, trust: [4.2, 3.5, 3.5] },
    },
  },
  passives: {
    Noukin: { rank: 2, attack: 30 },
    PAL_CorporateSlave: { rank: 1, attack: -30 },
    PAL_ALLAttack_up2: { rank: 3, attack: 20 },
    PAL_rude: { rank: 1, attack: 15 },
    Rare: { rank: 4, attack: 15, defense: 15 },
  },
  terms: {},
};

const input = (over: Partial<PalStatInput>): PalStatInput => ({
  level: 1,
  stars: 0,
  trust: 0,
  statue: { hp: 0, attack: 0, defense: 0 },
  passives: [],
  ...over,
});

describe("palStat", () => {
  // Max HP of full-health Pals read from a real save (Level.sav), with their
  // level, HP talent, condenser rank, trust and passives.
  it.each([
    [
      "pal_windchimes",
      74,
      input({
        level: 9,
        passives: ["Noukin", "PAL_CorporateSlave", "PAL_ALLAttack_up2"],
      }),
      984,
    ],
    ["pal_deer", 63, input({ level: 19, trust: 2 }), 1765],
    [
      "pal_hadesbird",
      46,
      input({ level: 48, trust: 7, passives: ["PAL_rude"] }),
      4235,
    ],
    ["pal_weaseldragon", 66, input({ level: 40, trust: 7, alpha: true }), 3891],
    [
      "pal_leafmomonga",
      89,
      input({ level: 17, stars: 1, alpha: true, passives: ["Rare"] }),
      1698,
    ],
    [
      "pal_leafmomonga",
      92,
      input({ level: 19, stars: 1, alpha: true, passives: ["Rare"] }),
      1845,
    ],
  ])("%s HP talent %i matches the save", (id, talent, inp, hp) => {
    expect(palStat(DATA, id, "hp", talent, inp)).toBe(hp);
  });

  it("applies trunc after each multiplier for attack and defense", () => {
    // (1 + 8*0.003) * 70 * (9*0.075) + 100 = 148.38 → 148; passives +30-30+20 → ×1.2 = 177
    const inp = input({
      level: 9,
      passives: ["Noukin", "PAL_CorporateSlave", "PAL_ALLAttack_up2"],
    });
    expect(palStat(DATA, "pal_windchimes", "attack", 8, inp)).toBe(177);
    // (1 + 0.297) * 70 * 0.675 + 50 = 111.28 → 111
    expect(palStat(DATA, "pal_windchimes", "defense", 99, inp)).toBe(111);
    // 4 stars ×1.2 → 133, statue 10 ×1.3 → 172
    expect(
      palStat(
        DATA,
        "pal_windchimes",
        "defense",
        99,
        input({
          level: 9,
          stars: 4,
          statue: { hp: 0, attack: 0, defense: 10 },
        }),
      ),
    ).toBe(172);
  });

  it("returns undefined for an unknown pal", () => {
    expect(palStat(DATA, "pal_nope", "hp", 0, input({}))).toBeUndefined();
    expect(
      palStats(DATA, "pal_nope", { hp: 0, attack: 0, defense: 0 }, input({})),
    ).toBeUndefined();
  });
});

describe("findTalents", () => {
  it("recovers the talent from the in-game value", () => {
    const inp = input({ level: 48, trust: 7, passives: ["PAL_rude"] });
    expect(findTalents(DATA, "pal_hadesbird", "hp", 4235, inp)).toEqual([46]);
  });

  it("returns every talent that gives the same number at low level", () => {
    const inp = input({ level: 1 });
    const hits = findTalents(
      DATA,
      "pal_windchimes",
      "attack",
      palStat(DATA, "pal_windchimes", "attack", 50, inp)!,
      inp,
    );
    expect(hits.length).toBeGreaterThan(1);
    expect(hits).toContain(50);
  });

  it("is empty when the value does not fit", () => {
    expect(
      findTalents(DATA, "pal_windchimes", "hp", 1, input({ level: 9 })),
    ).toEqual([]);
  });
});
