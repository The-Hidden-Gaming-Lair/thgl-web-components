/**
 * Palworld breeding — the child formula, the reverse lookup and a path finder,
 * over `config/breeding.json` (generated per build by data-forge
 * `data-mining/src/palworld/components.breeding.ts`). Pure + synchronous so the
 * calculator runs client-side and the per-pal pages render the same tables on
 * the server.
 *
 * Child of A × B:
 *  1. A and B are the same pal → that pal.
 *  2. A unique combo lists the pair → its child. Some rows require parent
 *     genders (Katress ♂ + Wixen ♀ → Wixen Noct, Katress ♀ + Wixen ♂ → Katress
 *     Ignis); without genders both outcomes are returned.
 *  3. Otherwise the pal whose breeding rank is closest to
 *     floor((rankA + rankB + 1) / 2). Never an IgnoreCombi pal or a pal that has
 *     a unique combo (those are only bred through their combo). Ties: the
 *     higher duplicate priority, then the non-variant pal.
 */

export type BreedingGender = "m" | "f";

export type BreedingPal = {
  key: string;
  tribe: string;
  rank: number;
  priority: number;
  ignore?: true;
  /** Chance (0-100) that an egg of this pal hatches male. */
  male: number;
  rarity: number;
  elements: string[];
  dex: string;
  variant?: true;
};

export type BreedingData = {
  build?: string;
  pals: Record<string, BreedingPal>;
  /** [parentA, genderA, parentB, genderB, child] */
  unique: [
    string,
    BreedingGender | null,
    string,
    BreedingGender | null,
    string,
  ][];
  settings: {
    passiveInheritWeights: number[];
    passiveRandomAddWeights: number[];
    talentInheritWeights: number[];
    bossRate: number;
    eggRanks: { maxRarity: number; hatchDivision: number }[];
  };
  cakes: {
    id: string;
    talentBonus: number[];
    mutationBonusPercent: number;
    eggs: number;
    inheritAllActives: boolean;
    passiveInheritOverride: number;
  }[];
};

export type BreedingOutcome = {
  child: string;
  /** Why: same species, a unique combo, or the rank formula. */
  via: "same" | "unique" | "rank";
  /** Required parent genders (unique gendered combos only), aligned to (a, b). */
  genders?: [BreedingGender | null, BreedingGender | null];
};

export type BreedingPair = { a: string; b: string; outcome: BreedingOutcome };

export type Breeder = {
  data: BreedingData;
  ids: string[];
  /** All outcomes of a × b (two only for gender-dependent unique combos). */
  breed(a: string, b: string): BreedingOutcome[];
  /** Every unordered parent pair that can produce `child`, easiest (least rare) first. */
  parentsOf(child: string): BreedingPair[];
  /** Every pair, computed once. */
  allPairs(): BreedingPair[];
  /** Rank formula target for a pair (for the "why" explanation). */
  targetRank(a: string, b: string): number;
};

const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export function createBreeder(data: BreedingData): Breeder {
  const ids = Object.keys(data.pals);

  // Unique combos keyed by unordered pair, genders re-aligned to the key order.
  const uniqueByPair = new Map<
    string,
    {
      child: string;
      ga: BreedingGender | null;
      gb: BreedingGender | null;
      first: string;
    }[]
  >();
  const uniqueChildren = new Set<string>();
  for (const [a, ga, b, gb, child] of data.unique) {
    if (!data.pals[a] || !data.pals[b] || !data.pals[child]) continue;
    uniqueChildren.add(child);
    const key = pairKey(a, b);
    const list = uniqueByPair.get(key) ?? [];
    list.push({ child, ga, gb, first: a });
    uniqueByPair.set(key, list);
  }

  // Rank-breeding pool, sorted so the first hit of a scan is the winner.
  const pool = ids
    .filter((id) => !data.pals[id].ignore && !uniqueChildren.has(id))
    .map((id) => ({ id, ...data.pals[id] }));

  const rankChild = new Map<number, string>();
  const rankResult = (target: number): string => {
    const hit = rankChild.get(target);
    if (hit) return hit;
    let best = pool[0];
    let bestDist = Infinity;
    for (const p of pool) {
      const d = Math.abs(p.rank - target);
      if (
        d < bestDist ||
        (d === bestDist &&
          (p.priority > best.priority ||
            (p.priority === best.priority && !p.variant && best.variant)))
      ) {
        best = p;
        bestDist = d;
      }
    }
    rankChild.set(target, best.id);
    return best.id;
  };

  const targetRank = (a: string, b: string) =>
    Math.floor((data.pals[a].rank + data.pals[b].rank + 1) / 2);

  const breed = (a: string, b: string): BreedingOutcome[] => {
    if (!data.pals[a] || !data.pals[b]) return [];
    if (a === b) return [{ child: a, via: "same" }];
    const combos = uniqueByPair.get(pairKey(a, b));
    if (combos?.length) {
      return combos.map((c) => {
        const [ga, gb] = c.first === a ? [c.ga, c.gb] : [c.gb, c.ga];
        return ga || gb
          ? {
              child: c.child,
              via: "unique" as const,
              genders: [ga, gb] as [
                BreedingGender | null,
                BreedingGender | null,
              ],
            }
          : { child: c.child, via: "unique" as const };
      });
    }
    return [{ child: rankResult(targetRank(a, b)), via: "rank" }];
  };

  let pairsCache: BreedingPair[] | undefined;
  const allPairs = () => {
    if (pairsCache) return pairsCache;
    const out: BreedingPair[] = [];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i; j < ids.length; j++) {
        for (const outcome of breed(ids[i], ids[j])) {
          out.push({ a: ids[i], b: ids[j], outcome });
        }
      }
    }
    pairsCache = out;
    return out;
  };

  // Easiest pairs first: lowest rarest-parent, then lowest combined rarity.
  const rarity = (id: string) => data.pals[id]?.rarity ?? 0;
  const parentsOf = (child: string) =>
    allPairs()
      .filter((p) => p.outcome.child === child)
      .sort(
        (x, y) =>
          Math.max(rarity(x.a), rarity(x.b)) -
            Math.max(rarity(y.a), rarity(y.b)) ||
          rarity(x.a) + rarity(x.b) - (rarity(y.a) + rarity(y.b)),
      );

  return { data, ids, breed, parentsOf, allPairs, targetRank };
}

/** One breeding step of a path: parents → child, with its expected eggs. */
export type BreedingStep = {
  a: string;
  b: string;
  child: string;
  genders?: [BreedingGender | null, BreedingGender | null];
  /** Expected eggs for THIS step (≥ 1; more when a gender is required). */
  eggs: number;
};

export type BreedingPlan = {
  target: string;
  /** Total expected eggs over all steps. */
  eggs: number;
  /** Steps in breeding order (parents before children). */
  steps: BreedingStep[];
};

const maleRate = (data: BreedingData, id: string) =>
  Math.min(Math.max((data.pals[id]?.male ?? 50) / 100, 0.01), 0.99);

/**
 * Cheapest way (by expected eggs) to breed `target` from the owned pals.
 * Owned pals count as available in both genders. A bred pal arrives with a
 * random gender: pairing two bred pals, or a gender-gated unique combo, needs
 * re-breeding until the gender fits — that is what the expected-egg cost counts.
 * Returns null when the target cannot be reached.
 */
export function findBreedingPlan(
  breeder: Breeder,
  owned: string[],
  target: string,
): BreedingPlan | null {
  const { data } = breeder;
  if (!data.pals[target]) return null;
  const cost = new Map<string, number>();
  const how = new Map<string, BreedingStep>();
  for (const id of owned) if (data.pals[id]) cost.set(id, 0);
  if (cost.has(target)) return { target, eggs: 0, steps: [] };

  // Expected attempts until a bred pal has gender g.
  const tries = (id: string, g: BreedingGender) => {
    const p = maleRate(data, id);
    return 1 / (g === "m" ? p : 1 - p);
  };

  const pairs = breeder.allPairs();
  // Bellman-Ford style relaxation over the (AND) pair graph — a handful of rounds.
  for (let round = 0; round < 64; round++) {
    let changed = false;
    for (const { a, b, outcome } of pairs) {
      const ca = cost.get(a);
      const cb = cost.get(b);
      if (ca === undefined || cb === undefined) continue;
      const child = outcome.child;
      if (child === a || child === b) continue;
      // A bred parent has a random gender. Re-breeding it only repeats ITS last
      // step (its own parents are still in the box), so a gender retry costs
      // one egg per attempt — never the whole subtree again.
      let extra = 0;
      const [ga, gb] = outcome.genders ?? [null, null];
      if (ga || gb) {
        // Gender-gated unique combo: each bred parent must hatch the right gender.
        if (ca > 0 && ga) extra += tries(a, ga) - 1;
        if (cb > 0 && gb) extra += tries(b, gb) - 1;
      } else if (ca > 0 && cb > 0) {
        // Two bred parents must be opposite genders: keep one, re-breed the other.
        const pm = maleRate(data, a);
        extra = pm * tries(b, "f") + (1 - pm) * tries(b, "m") - 1;
      }
      const total = ca + cb + extra + 1;
      const prev = cost.get(child);
      if (prev === undefined || total < prev - 1e-9) {
        cost.set(child, total);
        how.set(child, {
          a,
          b,
          child,
          ...(outcome.genders ? { genders: outcome.genders } : {}),
          eggs: 1 + extra,
        });
        changed = true;
      }
    }
    if (!changed) break;
  }

  if (!cost.has(target)) return null;
  const steps: BreedingStep[] = [];
  const seen = new Set<string>();
  const visit = (id: string) => {
    const step = how.get(id);
    if (!step || seen.has(id)) return;
    seen.add(id);
    visit(step.a);
    visit(step.b);
    steps.push(step);
  };
  visit(target);
  // Total over the distinct steps (the per-node cost double-counts a parent
  // species that is used twice in the tree).
  const eggs = steps.reduce((sum, st) => sum + st.eggs, 0);
  return { target, eggs, steps };
}
