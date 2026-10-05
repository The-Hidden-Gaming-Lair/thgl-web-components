/**
 * Once Human blueprint star calculator — over `config/blueprints.json`
 * (data-forge `once-human/blueprints.ts`, from the game's blueprint attr tables).
 *
 * `costs[i]` is the Starchrom price of reaching star `i + 1`: index 0 unlocks
 * the blueprint (star 1), index N raises it to star N + 1. A blueprint's star
 * is 0 while it is locked.
 */
export type OnceHumanBlueprint = {
  kind: "weapon" | "armor";
  rarity: number;
  costs: number[];
  /** Fragments that fuse into the blueprint (0 = can't be fused). */
  fragments: number;
  /** Gear the blueprint crafts per craft tier (codex `gear` ids). */
  gear: { id: string; tier: number }[];
};

export type OnceHumanBlueprintData = {
  currency: { id: string; name: string };
  rarities: Record<string, string>;
  blueprints: Record<string, OnceHumanBlueprint>;
};

export type BlueprintPlanEntry = { id: string; from: number; to: number };

export type BlueprintPlanLine = BlueprintPlanEntry & {
  cost: number;
  /** Per-star prices this line pays: `{ star, cost }` for every star gained. */
  steps: { star: number; cost: number }[];
};

export function blueprintMaxStar(bp: OnceHumanBlueprint): number {
  return bp.costs.length;
}

/** Clamp a star to 0..max (0 = locked). */
export function clampStar(bp: OnceHumanBlueprint, star: number): number {
  if (!Number.isFinite(star)) return 0;
  return Math.min(blueprintMaxStar(bp), Math.max(0, Math.trunc(star)));
}

/** Starchrom to go from star `from` (0 = locked) to star `to`. */
export function blueprintStarCost(
  bp: OnceHumanBlueprint,
  from: number,
  to: number,
): BlueprintPlanLine["steps"] {
  const a = clampStar(bp, from);
  const b = clampStar(bp, to);
  const steps: BlueprintPlanLine["steps"] = [];
  for (let star = a + 1; star <= b; star++) {
    steps.push({ star, cost: bp.costs[star - 1] ?? 0 });
  }
  return steps;
}

/** Cost of every plan line + the total; unknown ids are dropped. */
export function planBlueprints(
  data: OnceHumanBlueprintData,
  entries: BlueprintPlanEntry[],
): { lines: BlueprintPlanLine[]; total: number } {
  const lines: BlueprintPlanLine[] = [];
  for (const e of entries) {
    const bp = data.blueprints[e.id];
    if (!bp) continue;
    const from = clampStar(bp, e.from);
    const to = Math.max(from, clampStar(bp, e.to));
    const steps = blueprintStarCost(bp, from, to);
    lines.push({
      id: e.id,
      from,
      to,
      steps,
      cost: steps.reduce((sum, s) => sum + s.cost, 0),
    });
  }
  return { lines, total: lines.reduce((sum, l) => sum + l.cost, 0) };
}

/** Share-URL form: `id.from.to` joined by `,`. */
export function encodeBlueprintPlan(entries: BlueprintPlanEntry[]): string {
  return entries.map((e) => `${e.id}.${e.from}.${e.to}`).join(",");
}

export function decodeBlueprintPlan(
  data: OnceHumanBlueprintData,
  raw: string | null | undefined,
): BlueprintPlanEntry[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: BlueprintPlanEntry[] = [];
  for (const part of raw.split(",")) {
    const [id, from, to] = part.split(".");
    const bp = id ? data.blueprints[id] : undefined;
    if (!bp || seen.has(id!)) continue;
    seen.add(id!);
    const f = clampStar(bp, Number(from));
    out.push({ id: id!, from: f, to: Math.max(f, clampStar(bp, Number(to))) });
  }
  return out;
}
