/**
 * Aniimo evolution guide — pure logic over `config/evolutions.json`
 * (data-forge `aniimo/components.ts` → `evolutions`, from the game's
 * `pet_evolve_data`). Every text is a dict key (`evolutions.cond.*`,
 * `evolutions.form.*`, `evolutions.desc.*`), so the pages resolve them per
 * locale. Shared by the /evolutions hub and the /evolutions/<id> pages.
 */

export type EvolutionItem = {
  /** Codex item id (`/db/items/<id>`). */
  id: string;
  count: number;
  /** The universal substitute the game accepts instead of this stone. */
  alt?: { id: string; count: number };
};

export type EvolutionBranch = {
  /** Codex species id of the evolved Aniimo. */
  to: string;
  /** Required Aniimo level. */
  level?: number;
  /** Requirement that unlocks the branch (defeat the Alpha, a Journey, a challenge). */
  unlock?: string;
  /** Other requirements (talent, personality, potential, place, weather, an action). */
  conditions: string[];
  items: EvolutionItem[];
  /** The game's one-line description of the evolved form. */
  desc?: string;
  /** Only for species with several forms: the forms that can take this branch + what each adds. */
  forms?: { form: string; extra: string[] }[];
};

export type EvolutionSpecies = {
  stage?: number;
  /** Species this one evolves from. */
  from: string[];
  evolutions: EvolutionBranch[];
};

export type EvolutionsData = {
  /** Every evolution family, root first, in game order. */
  lines: { id: string; species: string[] }[];
  species: Record<string, EvolutionSpecies>;
};

/** The family a species belongs to, or undefined when it never evolves. */
export function evolutionLineOf(
  data: EvolutionsData,
  id: string,
): EvolutionsData["lines"][number] | undefined {
  return data.lines.find((l) => l.species.includes(id));
}

/** Path from the line's root to `id` (inclusive), following `from`. */
export function evolutionPath(data: EvolutionsData, id: string): string[] {
  const path = [id];
  const seen = new Set(path);
  let cur = data.species[id];
  while (cur?.from.length) {
    const prev = cur.from[0];
    if (seen.has(prev)) break;
    seen.add(prev);
    path.unshift(prev);
    cur = data.species[prev];
  }
  return path;
}

/** The branch that turns `from` into `to`, if any. */
export function evolutionBranch(
  data: EvolutionsData,
  from: string,
  to: string,
): EvolutionBranch | undefined {
  return data.species[from]?.evolutions.find((b) => b.to === to);
}

/**
 * Everything needed to raise a line's root up to `id`: the highest level on
 * the way and every stone summed per item (substitutes are an alternative,
 * not a cost, so they are not added up).
 */
export function evolutionCost(
  data: EvolutionsData,
  id: string,
): { steps: number; level?: number; items: { id: string; count: number }[] } {
  const path = evolutionPath(data, id);
  const items = new Map<string, number>();
  let level: number | undefined;
  for (let i = 1; i < path.length; i++) {
    const b = evolutionBranch(data, path[i - 1], path[i]);
    if (!b) continue;
    if (b.level !== undefined) level = Math.max(level ?? 0, b.level);
    for (const it of b.items)
      items.set(it.id, (items.get(it.id) ?? 0) + it.count);
  }
  return {
    steps: path.length - 1,
    level,
    items: [...items].map(([itemId, count]) => ({ id: itemId, count })),
  };
}

/** Every codex item id the guide links (stones and their substitutes). */
export function evolutionItemIds(data: EvolutionsData): string[] {
  const ids = new Set<string>();
  for (const sp of Object.values(data.species))
    for (const b of sp.evolutions)
      for (const it of b.items) {
        ids.add(it.id);
        if (it.alt) ids.add(it.alt.id);
      }
  return [...ids];
}
