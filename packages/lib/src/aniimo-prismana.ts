/**
 * Aniimo Prismana tracker — pure logic over `config/prismana.json`
 * (data-forge `aniimo/components.ts` → `prismana`, inbox #327). Every
 * Prismana form with the sources the game files prove, the weekly
 * hidden-area rotation per server region, the Prismana Flow stages and the
 * Prismana Orb. Texts are dict keys (`prismana.*`), resolved per locale.
 */

/** A spot on the map: `node` is the rainbow_spawn marker's node id on `map`. */
export type PrismanaSpot = { node: string; map: string };

export type PrismanaSource =
  /** The Prismana Flow of a Branch area attracts it at a fixed spot. */
  | ({ kind: "flow" } & PrismanaSpot)
  /** It appears in a hidden area during the listed rotation weeks. */
  | ({ kind: "hidden"; weeks: number[] } & PrismanaSpot)
  /** An egg that always hatches it; `source` = where the game says the egg comes from. */
  | { kind: "egg"; item: string; source: string }
  /** It evolves from this (Prismana) species. */
  | { kind: "evolve"; from: string }
  /** The RV reward at RV level `level`; `text` = the game's own line. */
  | { kind: "rv"; level: number; text: string };

export type PrismanaEntry = {
  /** Codex species id (`/db/aniimo/<id>`). */
  id: string;
  /** Game pet id of the Prismana form. */
  pet: number;
  sources: PrismanaSource[];
};

export type PrismanaWeek = {
  week: number;
  /** Unix seconds per region id: window opens / closes (exclusive). */
  start: Record<string, number>;
  end: Record<string, number>;
  species: ({ id: string } & PrismanaSpot)[];
};

export type PrismanaData = {
  prismana: PrismanaEntry[];
  hidden: { regions: string[]; weeks: PrismanaWeek[] };
  flow: {
    /** Branch Prismatic Energy needed per stage and the game's chance label. */
    stages: { stage: number; energy: number; chance: string }[];
    /** Game strings explaining the Prismana Flow (dict keys). */
    notes: string[];
  };
  /** The Prismana Orb: turns an owned Aniimo into its (unlocked) Prismana form. */
  orb: { item: string; use: string; sources: string[] };
  /** The Mysterious Prismana Egg: hatches a random Prismana. */
  mystery: { item: string; sources: string[] };
};

type RotationWeek = Pick<PrismanaWeek, "start" | "end">;

/** Where a region stands in the rotation at `now` (ms). */
export type PrismanaRotation<W extends RotationWeek = PrismanaWeek> = {
  /** The week whose window is open now. */
  current?: W;
  /** The next week to open. */
  next?: W;
  /** ms until `current` closes, or until `next` opens when nothing is open. */
  msLeft?: number;
};

export function prismanaRotation<W extends RotationWeek>(
  weeks: W[],
  region: string,
  now: number,
): PrismanaRotation<W> {
  const sec = now / 1000;
  const sorted = weeks
    .filter((w) => w.start[region] !== undefined)
    .sort((a, b) => a.start[region] - b.start[region]);
  const current = sorted.find(
    (w) => w.start[region] <= sec && sec < w.end[region],
  );
  const next = sorted.find((w) => w.start[region] > sec);
  const target = current ? current.end[region] : next?.start[region];
  return {
    current,
    next,
    msLeft: target === undefined ? undefined : target * 1000 - now,
  };
}

/** Source kinds in display order (each Prismana lists its sources this way). */
export const PRISMANA_SOURCE_ORDER: PrismanaSource["kind"][] = [
  "flow",
  "hidden",
  "egg",
  "rv",
  "evolve",
];

export function sortPrismanaSources(
  sources: PrismanaSource[],
): PrismanaSource[] {
  return [...sources].sort(
    (a, b) =>
      PRISMANA_SOURCE_ORDER.indexOf(a.kind) -
      PRISMANA_SOURCE_ORDER.indexOf(b.kind),
  );
}

/** Filter type of every Prismana spot marker (the game's rainbow map mark). */
export const PRISMANA_SPOT_TYPE = "rainbow_spawn";

/** The map deep link of one spot (same URL the codex location list builds). */
export function prismanaSpotPath(spot: PrismanaSpot): string {
  const node = encodeURIComponent(spot.node);
  return `/maps/${spot.map}/${PRISMANA_SPOT_TYPE}/${node}?id=${node}`;
}
