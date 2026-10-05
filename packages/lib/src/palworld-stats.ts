/**
 * Palworld stat + IV (talent) calculator over `config/stats.json` (generated per
 * build by data-forge `data-mining/src/palworld/components.stats.ts`).
 *
 * The formula is the game's own (UPalDatabaseCharacterParameter::Get*BySaveParameter,
 * read from the shipping binary), including its single-precision float math and the
 * truncation after every step, so the numbers match the in-game status screen:
 *
 *   base = species stat + trustRank * trust bonus
 *   HP   = trunc(((1 + IV * talentRate) * base + hpLevelAdd) * hpLevelMul * Lv + hpConst)
 *   ATK  = trunc((1 + IV * talentRate) * base * (Lv * attackLevelMul) + attackConst)
 *   DEF  = trunc((1 + IV * talentRate) * base * (Lv * defenseLevelMul) + defenseConst)
 *   then trunc(x * (1 + (condenser - 1) * condenserRate)),
 *        trunc(x * (1 + statue * statueRate)),
 *        trunc(x * (1 + sum(passive %) * passiveRate)).
 */

export type PalStat = "hp" | "attack" | "defense";
export const PAL_STATS: PalStat[] = ["hp", "attack", "defense"];

export type PalStatsSettings = {
  hpLevelMul: number;
  hpLevelAdd: number;
  hpConst: number;
  attackLevelMul: number;
  attackConst: number;
  defenseLevelMul: number;
  defenseConst: number;
  talentRate: number;
  condenserRate: number;
  statueRate: number;
  passiveRate: number;
  maxLevel: number;
  maxCondenserRank: number;
  maxStatueRank: number;
  maxTrustRank: number;
  maxTalent: number;
};

export type PalBaseStats = {
  hp: number;
  attack: number;
  defense: number;
  trust: [number, number, number];
};

export type PalStatsData = {
  build?: string;
  settings: PalStatsSettings;
  /**
   * Keyed by paldeck codex id (`pal_<id>`). trust = [hp, attack, defense] per trust
   * rank. `alpha` = a caught Alpha's own base stats (the game keeps its boss row).
   */
  pals: Record<string, PalBaseStats & { dex: string; alpha?: PalBaseStats }>;
  /** Stat-changing passives, keyed by game id; values are percent. */
  passives: Record<string, { rank: number } & Partial<Record<PalStat, number>>>;
  /** Localized passive names per locale (`passive.<id>`). */
  terms: Record<string, Record<string, string>>;
};

export type PalStatInput = {
  level: number;
  /** A caught Alpha (uses the pal's `alpha` stats when it has them). */
  alpha?: boolean;
  /** Condenser stars 0-4 (the game stores rank 1-5). */
  stars: number;
  /** Trust (friendship) rank 0-10. */
  trust: number;
  /** Statue of Power ranks per stat. */
  statue: Record<PalStat, number>;
  /** Passive ids. */
  passives: string[];
};

const f = Math.fround;
const STAT_INDEX: Record<PalStat, number> = { hp: 0, attack: 1, defense: 2 };

/** Sum of the passives' percent for one stat. */
export function passivePercent(
  data: PalStatsData,
  passives: string[],
  stat: PalStat,
): number {
  let sum = 0;
  for (const id of passives) sum = f(sum + f(data.passives[id]?.[stat] ?? 0));
  return sum;
}

/** One stat of a pal as shown in the game, for a talent (IV) 0-100. */
export function palStat(
  data: PalStatsData,
  palId: string,
  stat: PalStat,
  talent: number,
  input: PalStatInput,
): number | undefined {
  const entry = data.pals[palId];
  if (!entry) return undefined;
  const pal = (input.alpha && entry.alpha) || entry;
  const s = data.settings;
  const level = Math.trunc(input.level);
  let base = f(pal[stat]);
  if (input.trust >= 1)
    base = f(base + f(f(input.trust) * f(pal.trust[STAT_INDEX[stat]])));
  const talentMul = f(f(f(talent) * f(s.talentRate)) + 1);

  let v: number;
  if (stat === "hp") {
    v = f(f(talentMul * base) + f(s.hpLevelAdd));
    v = f(f(v * f(s.hpLevelMul)) * f(level));
    v = f(v + f(s.hpConst));
  } else {
    const levelMul = stat === "attack" ? s.attackLevelMul : s.defenseLevelMul;
    const constPlus = stat === "attack" ? s.attackConst : s.defenseConst;
    v = f(f(talentMul * base) * f(f(level) * f(levelMul)));
    v = f(v + f(constPlus));
  }
  let n = Math.trunc(v);
  n = Math.trunc(f(f(n) * f(f(f(input.stars) * f(s.condenserRate)) + 1)));
  n = Math.trunc(f(f(n) * f(f(f(input.statue[stat]) * f(s.statueRate)) + 1)));
  const rate = f(
    f(passivePercent(data, input.passives, stat) * f(s.passiveRate)) + 1,
  );
  return Math.trunc(f(f(n) * Math.max(0, rate)));
}

/** All three stats for given talents. */
export function palStats(
  data: PalStatsData,
  palId: string,
  talents: Record<PalStat, number>,
  input: PalStatInput,
): Record<PalStat, number> | undefined {
  if (!data.pals[palId]) return undefined;
  return Object.fromEntries(
    PAL_STATS.map((stat) => [
      stat,
      palStat(data, palId, stat, talents[stat], input)!,
    ]),
  ) as Record<PalStat, number>;
}

/**
 * Talents (IVs) that produce the in-game value of a stat. Several talents can give
 * the same number at low levels, so this returns every match (ascending); an empty
 * list means the inputs (level, stars, statue, trust, passives) don't fit the value.
 */
export function findTalents(
  data: PalStatsData,
  palId: string,
  stat: PalStat,
  value: number,
  input: PalStatInput,
): number[] {
  const out: number[] = [];
  for (let t = 0; t <= data.settings.maxTalent; t++) {
    if (palStat(data, palId, stat, t, input) === value) out.push(t);
  }
  return out;
}
