// Turns a world seed + settings into map node buckets: strips the DEFAULT
// resource/well markers from the fetched static nodes and replaces them with the
// seed-adjusted distribution. The randomization itself is the verified port in
// ./algorithm (proven byte-for-byte against the game's algorithm).
//
// Filter type-id scheme (must match data-forge satisfactory extraction):
//   solid node normal  -> "OreIron"            (base key = Desc_<X>_C stripped)
//   solid node pure     -> "OreIron_RP_Pure"
//   solid node impure   -> "OreIron_RP_Inpure"  (game's "Inpure" typo, preserved)
//   fracking core well  -> "LiquidOil_Well"
// Deposits ("OreIron_Deposit_RP_Pure") use a distinct id and are NOT seed-driven,
// so exact-id stripping leaves them (and geysers, slugs, drives, etc.) untouched.

import { applyRandomizationSettings } from "./algorithm";
import type { Purity, PuritySettings, RandomizationMode, World } from "./types";

/** Live purity counts across solid resource nodes for the given seed settings. */
export function seedPuritySummary(
  base: World,
  settings: SeedSettings,
): { impure: number; normal: number; pure: number; total: number } {
  const world = structuredClone(base) as World;
  applyRandomizationSettings(
    world,
    settings.seed,
    settings.mode,
    settings.purity,
  );
  let impure = 0;
  let normal = 0;
  let pure = 0;
  for (const n of world.resourceNodes) {
    if (n.purity === "RP_Pure") pure++;
    else if (n.purity === "RP_Inpure") impure++;
    else normal++;
  }
  return { impure, normal, pure, total: world.resourceNodes.length };
}

/** Minimal shape of a coordinates-provider node bucket that we read/produce. */
export interface SeedNodeBucket {
  type: string;
  static?: boolean;
  mapName?: string;
  spawns: { id?: string; p: [number, number, number] }[];
}

export interface SeedSettings {
  seed: number;
  mode: RandomizationMode;
  purity: PuritySettings;
}

const strip = (descriptor: string): string =>
  descriptor.replace(/^Desc_/, "").replace(/_C$/, "");

export function solidTypeId(resource: string, purity: Purity): string {
  const base = strip(resource);
  if (purity === "RP_Pure") return `${base}_RP_Pure`;
  if (purity === "RP_Inpure") return `${base}_RP_Inpure`;
  return base; // normal has no suffix
}

export const wellTypeId = (resource: string): string =>
  `${strip(resource)}_Well`;

/**
 * Exact filter type-ids for every default resource + well marker in the base
 * world — the buckets to remove before injecting the seeded ones. Derived from
 * the base data (no hardcoded resource list), exact-match so deposits survive.
 */
export function resourceTypeIdUniverse(base: World): Set<string> {
  const ids = new Set<string>();
  for (const key of new Set(base.resourceNodes.map((n) => strip(n.resource)))) {
    ids.add(key);
    ids.add(`${key}_RP_Pure`);
    ids.add(`${key}_RP_Inpure`);
  }
  for (const core of base.frackingCores) ids.add(wellTypeId(core.resource));
  return ids;
}

/** Group the seed-adjusted world into node buckets keyed by filter type-id. */
export function computeSeedBuckets(
  base: World,
  settings: SeedSettings,
  mapName = "world",
): SeedNodeBucket[] {
  const world = structuredClone(base) as World;
  applyRandomizationSettings(
    world,
    settings.seed,
    settings.mode,
    settings.purity,
  );

  const byType = new Map<string, SeedNodeBucket>();
  const add = (type: string, id: string, p: [number, number, number]) => {
    let bucket = byType.get(type);
    if (!bucket) {
      bucket = { type, static: true, mapName, spawns: [] };
      byType.set(type, bucket);
    }
    bucket.spawns.push({ id, p });
  };

  for (const n of world.resourceNodes)
    add(solidTypeId(n.resource, n.purity), n.name, n.location);
  for (const c of world.frackingCores)
    add(wellTypeId(c.resource), c.name, c.location);

  return [...byType.values()];
}

/**
 * Replace the default resource/well buckets in a fetched `staticNodes` array
 * with the seed-adjusted ones. Non-resource buckets pass through untouched.
 * Generic over the bucket type so it composes with the provider's NodesCoordinates.
 */
export function applySeedToStaticNodes<T extends { type: string }>(
  staticNodes: readonly T[],
  base: World,
  settings: SeedSettings,
  mapName = "world",
): T[] {
  const universe = resourceTypeIdUniverse(base);
  const kept = staticNodes.filter((n) => !universe.has(n.type));
  return kept.concat(
    computeSeedBuckets(base, settings, mapName) as unknown as T[],
  );
}
