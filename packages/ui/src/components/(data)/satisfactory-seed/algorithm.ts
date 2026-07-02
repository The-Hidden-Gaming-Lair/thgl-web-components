// Faithful TypeScript port of Konsl's satisfactory-world-generator randomization
// (random_stream.rs + randomization.rs). Given a base "world" and a
// (seed, mode, purity) it reproduces the game's randomized resource-node
// distribution EXACTLY — validated byte-for-byte against a Rust oracle built
// from the same source (see README.md).
//
// Fidelity notes:
//  - Unreal FRandomStream is an LCG over u32; all arithmetic is 32-bit.
//  - Rust computes frand()/frand_range() in f32; we mirror that with Math.fround
//    so truncation boundaries (`as usize`) land identically.
//  - `x as usize` on a non-negative f32 is Math.trunc.
//  - Vec::remove / Vec::swap map to splice / index swap.

import {
  ALL_RESOURCES,
  hasTag,
  PURITY_VALUE,
  type FrackingCore,
  type GameplayTag,
  type Purity,
  type PuritySettings,
  type RandomizationMode,
  type ResourceDescriptor,
  type ResourceNode,
  type World,
} from "./types";

// --- RandomStream (Unreal FRandomStream LCG) ---------------------------------

const F32_BUF = new ArrayBuffer(4);
const F32_F = new Float32Array(F32_BUF);
const F32_U = new Uint32Array(F32_BUF);

export class RandomStream {
  private state: number; // u32

  constructor(seed: number) {
    // Konsl: seed.cast_unsigned() — reinterpret the i32 bit pattern as u32.
    this.state = seed >>> 0;
  }

  private mutate(): void {
    // (state * 196314165 + 907633515) mod 2^32
    this.state = (Math.imul(this.state, 196314165) + 907633515) >>> 0;
  }

  frand(): number {
    this.mutate();
    F32_U[0] = (0x3f800000 | (this.state >>> 9)) >>> 0;
    return Math.fround(F32_F[0] - 1.0); // f32 in [0, 1)
  }

  /** Rust: range.start + (range.end - range.start) * frand(), computed in f32. */
  frandRange(start: number, end: number): number {
    const span = Math.fround(end - start);
    const prod = Math.fround(span * this.frand());
    return Math.fround(start + prod);
  }
}

/** Rust `f32 as usize` for a non-negative value: truncate toward zero. */
function toIndex(f: number): number {
  return Math.trunc(f);
}

// --- Ordering helpers (mirror Rust Ord impls) --------------------------------

/** Byte-order string comparison (ASCII names → same as Rust String Ord). */
function cmpStr(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

interface NodeInfo {
  resource: ResourceDescriptor;
  purity: Purity | null; // None for fracking cores
  totalThroughput: number;
}

/** ResourceNodeInfo::cmp — resource internal name, then purity, then throughput. */
function cmpNodeInfo(a: NodeInfo, b: NodeInfo): number {
  if (a.resource !== b.resource) return cmpStr(a.resource, b.resource);
  if (a.purity !== b.purity) {
    // Option<ResourcePurity>::cmp — None < Some, else by ordinal value.
    if (a.purity === null) return -1;
    if (b.purity === null) return 1;
    return PURITY_VALUE[a.purity] - PURITY_VALUE[b.purity];
  }
  return a.totalThroughput - b.totalThroughput;
}

// --- Core algorithm ----------------------------------------------------------

function shuffle<T>(rng: RandomStream, pool: T[]): void {
  if (pool.length < 2) return; // Rust would underflow on len 0; pools are non-empty
  for (let i = 0; i < pool.length - 1; i++) {
    const swapIndex = i + toIndex(rng.frandRange(0, pool.length - i));
    const tmp = pool[i];
    pool[i] = pool[swapIndex];
    pool[swapIndex] = tmp;
  }
}

function getPurityOverride(
  rng: RandomStream,
  purity: Purity | null,
  settings: PuritySettings,
): Purity | null {
  switch (settings) {
    case "no_change":
      return null;
    case "all_pure":
      return "RP_Pure";
    case "all_normal":
      return "RP_Normal";
    case "all_impure":
      return "RP_Inpure";
    case "all_random":
      switch (toIndex(rng.frandRange(0, 3))) {
        case 0:
          return "RP_Inpure";
        case 1:
          return "RP_Normal";
        case 2:
          return "RP_Pure";
        default:
          return null;
      }
    case "increase":
      if (purity === null) return null;
      return purity === "RP_Inpure" ? "RP_Normal" : "RP_Pure";
    case "decrease":
      if (purity === null) return null;
      return purity === "RP_Pure" ? "RP_Normal" : "RP_Inpure";
  }
}

function modifyNodeDistribution(
  rng: RandomStream,
  pool: NodeInfo[],
  tag: GameplayTag,
  multiplier: number,
): void {
  let matchingCount = pool.filter((n) => hasTag(n.resource, tag)).length;
  // (matching as f32 * multiplier).round() — half away from zero == Math.round for positives.
  const modifiedCount = Math.round(
    Math.fround(Math.fround(matchingCount) * Math.fround(multiplier)),
  );

  const resourceOptions = ALL_RESOURCES.filter((r) => hasTag(r, tag)).sort(
    cmpStr,
  );

  shuffle(rng, pool);

  const seen = new Set<ResourceDescriptor>();
  for (const n of pool) {
    if (matchingCount >= modifiedCount) break;
    if (hasTag(n.resource, tag)) continue;
    if (!seen.has(n.resource)) {
      seen.add(n.resource); // first sighting: skip, only replace on repeats
      continue;
    }
    n.resource =
      resourceOptions[toIndex(rng.frandRange(0, resourceOptions.length))];
    matchingCount += 1;
  }
}

function distributeThroughput(core: FrackingCore, throughput: number): void {
  for (const s of core.satellites) s.purity = "RP_Pure";

  let error = core.satellites.length * PURITY_VALUE.RP_Pure - throughput;
  if (error < 2) return;

  const convertCount = Math.min(Math.floor(error / 2), core.satellites.length);
  for (let i = 0; i < convertCount; i++)
    core.satellites[i].purity = "RP_Normal";
  error += convertCount * (PURITY_VALUE.RP_Normal - PURITY_VALUE.RP_Pure);

  if (error < 1) return;

  const impureCount = Math.min(error, core.satellites.length);
  for (let i = 0; i < impureCount; i++) core.satellites[i].purity = "RP_Inpure";
}

/**
 * Apply randomization settings to a world IN PLACE. The caller should pass a
 * deep copy if it needs to preserve the base world. After this returns, the
 * world's node arrays are sorted by name and their resource/purity reflect the
 * randomized distribution. Node LOCATIONS are never modified. Geysers are only
 * re-sorted, never reassigned (matches the game).
 */
export function applyRandomizationSettings(
  world: World,
  seed: number,
  mode: RandomizationMode,
  puritySettings: PuritySettings,
): void {
  const rng = new RandomStream(seed);

  world.resourceNodes.sort((a, b) => cmpStr(a.name, b.name));
  world.geysers.sort((a, b) => cmpStr(a.name, b.name));
  world.frackingCores.sort((a, b) => cmpStr(a.name, b.name));
  for (const c of world.frackingCores)
    c.satellites.sort((a, b) => cmpStr(a.name, b.name));

  if (mode === "none") {
    for (const n of world.resourceNodes) {
      const newPurity = getPurityOverride(rng, n.purity, puritySettings);
      if (newPurity === null) continue;
      n.purity = newPurity;
    }
  } else {
    const pool: NodeInfo[] = world.resourceNodes.map((n) => ({
      resource: n.resource,
      purity: n.purity,
      totalThroughput: 0,
    }));
    pool.sort(cmpNodeInfo);

    if (mode === "basic_rich") modifyNodeDistribution(rng, pool, "basic", 1.1);
    else if (mode === "advanced_rich")
      modifyNodeDistribution(rng, pool, "advanced", 3.0);
    else if (mode === "fossil_fuel_rich")
      modifyNodeDistribution(rng, pool, "fossil_fuel", 2.0);

    for (const n of world.resourceNodes) {
      const poolIndex = toIndex(rng.frandRange(0, pool.length));
      const info = pool.splice(poolIndex, 1)[0];
      n.resource = info.resource;
      const newPurity = getPurityOverride(rng, info.purity, puritySettings);
      if (newPurity === null) continue;
      n.purity = newPurity;
    }

    const frackingPool: NodeInfo[] = world.frackingCores.map((c) => ({
      resource: c.resource,
      purity: null,
      totalThroughput: c.satellites.reduce(
        (sum, s) => sum + PURITY_VALUE[s.purity],
        0,
      ),
    }));
    frackingPool.sort(cmpNodeInfo);

    shuffle(rng, frackingPool);

    for (const core of world.frackingCores) {
      const poolIndex = toIndex(rng.frandRange(0, frackingPool.length));
      const info = frackingPool.splice(poolIndex, 1)[0];
      core.resource = info.resource;
      distributeThroughput(core, info.totalThroughput);
    }
  }

  if (puritySettings !== "no_change") {
    const satellites = world.frackingCores
      .flatMap((c) => c.satellites)
      .sort((a, b) => cmpStr(a.name, b.name));
    for (const s of satellites) {
      const newPurity = getPurityOverride(rng, s.purity, puritySettings);
      if (newPurity === null) continue;
      s.purity = newPurity;
    }
  }
}
