/**
 * Weakness Chart — for games that ship `config/weaknesses.json` (Grounded 2,
 * data-forge `grounded2/weaknesses.ts`): how much damage each creature takes
 * from each damage type, and which weapons deal which damage type. Names and
 * icons come from the codex (`types[].entry` = a codex entry id).
 */
export const WEAKNESS_CHART_PATH = "/weakness-chart";

export type WeaknessData = {
  /** Chart columns in display order. */
  types: Array<{ id: string; entry: string }>;
  /** Codex creature id → damage type id → damage taken multiplier (only values ≠ 1). */
  creatures: Record<string, Record<string, number>>;
  /** Codex weapon id → damage type ids it deals. */
  weapons?: Record<string, string[]>;
};

/** Damage taken multiplier of a creature for a damage type (1 = normal). */
export function damageMultiplier(
  data: WeaknessData,
  creatureId: string,
  typeId: string,
): number {
  return data.creatures[creatureId]?.[typeId] ?? 1;
}

/** Signed percent change of damage taken: 1.3 → 30, 0.75 → -25, 0.1 → -90. */
export function damagePercent(multiplier: number): number {
  return Math.round((multiplier - 1) * 100);
}

/** "+30%", "−25%", "" for normal damage. */
export function formatDamagePercent(multiplier: number): string {
  const pct = damagePercent(multiplier);
  if (pct === 0) return "";
  return pct > 0 ? `+${pct}%` : `−${Math.abs(pct)}%`;
}

export type WeaknessLevel =
  | "very-weak"
  | "weak"
  | "normal"
  | "resistant"
  | "very-resistant";

/** Coarse band for colouring a chart cell (±25% and beyond = "very"). */
export function weaknessLevel(multiplier: number): WeaknessLevel {
  if (multiplier >= 1.25) return "very-weak";
  if (multiplier > 1) return "weak";
  if (multiplier === 1) return "normal";
  if (multiplier > 0.6) return "resistant";
  return "very-resistant";
}

/** A creature's weaknesses (most damage first) and resistances (least damage first). */
export function creatureModifiers(data: WeaknessData, creatureId: string) {
  const order = new Map(data.types.map((t, i) => [t.id, i]));
  const entries = Object.entries(data.creatures[creatureId] ?? {}).filter(
    ([t, v]) => order.has(t) && v !== 1,
  );
  const byColumn = (a: [string, number], b: [string, number]) =>
    (order.get(a[0]) ?? 0) - (order.get(b[0]) ?? 0);
  return {
    weaknesses: entries
      .filter(([, v]) => v > 1)
      .sort((a, b) => b[1] - a[1] || byColumn(a, b)),
    resistances: entries
      .filter(([, v]) => v < 1)
      .sort((a, b) => a[1] - b[1] || byColumn(a, b)),
  };
}

/**
 * Creature ids ordered for a column sort: by multiplier for that damage type
 * (descending = weakest first), ties by the given name order.
 */
export function sortCreaturesByType(
  data: WeaknessData,
  creatureIds: string[],
  typeId: string,
  nameOf: (id: string) => string,
  descending = true,
): string[] {
  return [...creatureIds].sort((a, b) => {
    const d =
      damageMultiplier(data, a, typeId) - damageMultiplier(data, b, typeId);
    return (descending ? -d : d) || nameOf(a).localeCompare(nameOf(b));
  });
}

/** Weapons that deal any of the given damage types. */
export function weaponsDealing(
  data: WeaknessData,
  typeIds: string[],
): string[] {
  const wanted = new Set(typeIds);
  return Object.entries(data.weapons ?? {})
    .filter(([, types]) => types.some((t) => wanted.has(t)))
    .map(([id]) => id);
}
