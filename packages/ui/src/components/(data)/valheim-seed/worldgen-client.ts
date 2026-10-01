"use client";
// Client for the Valheim world generator: a module worker running the seed-generator
// WASM bundle that data-forge publishes as a content-hashed folder on the data CDN
// (`/valheim/bundles/worldgen-<hash>/`, named by `config/worldgen.json`). The bundle
// code is not part of this repo — it is loaded at runtime from the CDN.

import { getAppUrl } from "@repo/lib";

export interface WorldgenConfig {
  bundle: string;
  defaultSeed: string;
  worldGenVersion: number;
  abiVersion: number;
  mapName: string;
  worldHalf: number;
  /** The static pyramid's geometry — generated tiles use the same z/x/y addressing. */
  tiles: {
    tileSize: number;
    bounds: [[number, number], [number, number]];
    transformation: [number, number, number, number];
  };
  locationTypes: Record<string, string>;
  /** vegetation source spec (worldgen resource query) -> filter type */
  resourceTypes: { type: string; source: string }[];
}

export interface GeneratedLocation {
  prefabName: string;
  biome: number;
  x: number;
  y: number;
  z: number;
}

type Pending = {
  resolve: (v: any) => void;
  reject: (e: Error) => void;
  onLocations?: (locations: GeneratedLocation[], done: boolean) => void;
};

/** One module worker over the hosted bundle (cross-origin module import via a Blob). */
class WorldgenWorker {
  private worker: Worker;
  private nextId = 1;
  private pending = new Map<number, Pending>();

  constructor(workerUrl: string) {
    const blob = new Blob([`import ${JSON.stringify(workerUrl)};`], {
      type: "text/javascript",
    });
    this.worker = new Worker(URL.createObjectURL(blob), { type: "module" });
    this.worker.addEventListener("message", (e: MessageEvent) =>
      this.onMessage(e.data),
    );
    this.worker.addEventListener("error", (e) => {
      const err = new Error(
        e.message || "Valheim world generator failed to load.",
      );
      for (const p of this.pending.values()) p.reject(err);
      this.pending.clear();
    });
  }

  private onMessage(msg: any) {
    const p = msg && this.pending.get(msg.id);
    if (!p) return;
    if (msg.type === "error") {
      this.pending.delete(msg.id);
      p.reject(new Error(msg.message || "Valheim world generation failed."));
    } else if (msg.type === "generated" || msg.type === "resourcePage") {
      this.pending.delete(msg.id);
      p.resolve(msg);
    } else if (msg.type === "locations") {
      p.onLocations?.(msg.locations, msg.done);
      if (msg.done) {
        this.pending.delete(msg.id);
        p.resolve(undefined);
      }
    }
  }

  request<T>(
    payload: Record<string, unknown>,
    onLocations?: Pending["onLocations"],
  ): Promise<T> {
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject, onLocations });
      this.worker.postMessage({ ...payload, id });
    });
  }

  terminate() {
    this.worker.terminate();
    this.pending.clear();
  }
}

let configPromise: Promise<WorldgenConfig> | null = null;
export function loadWorldgenConfig(
  appName = "valheim",
): Promise<WorldgenConfig> {
  configPromise ??= fetch(getAppUrl(appName, "/config/worldgen.json")).then(
    (r) => {
      if (!r.ok) throw new Error(`worldgen.json ${r.status}`);
      return r.json() as Promise<WorldgenConfig>;
    },
  );
  configPromise.catch(() => (configPromise = null));
  return configPromise;
}

/**
 * Two workers: one renders map tiles, one places locations (a whole-world placement pass
 * takes seconds and must not stall tiles). Created lazily, shared by every consumer.
 */
let workers: { tiles: WorldgenWorker; markers: WorldgenWorker } | null = null;
async function getWorkers(appName = "valheim") {
  if (workers) return workers;
  const cfg = await loadWorldgenConfig(appName);
  // absolute: the Blob worker has no base URL (the dev proxy path is relative)
  const url = new URL(
    getAppUrl(appName, `${cfg.bundle}valheim-worldgen.worker.js`),
    window.location.href,
  ).href;
  workers = {
    tiles: new WorldgenWorker(url),
    markers: new WorldgenWorker(url),
  };
  return workers;
}

/** One map tile (row 0 = north) as an ImageBitmap, WebGL-composited like the in-game minimap. */
export async function generateTile(
  seed: string,
  worldGenVersion: number,
  zoom: number,
  tileX: number,
  tileY: number,
  size: number,
): Promise<ImageBitmap> {
  const w = await getWorkers();
  const res = await w.tiles.request<{
    width: number;
    height: number;
    pixels: ArrayBuffer;
  }>({
    type: "generateTile",
    seed,
    zoom,
    tileX,
    tileY,
    size,
    worldGenVersion,
  });
  const data = new ImageData(
    new Uint8ClampedArray(res.pixels),
    res.width,
    res.height,
  );
  return createImageBitmap(data);
}

/** Generating zones span -164..164 per axis; exact point pages own 8x8 zones each. */
const ZONE_MIN = -164;
const ZONE_MAX = 164;
const PAGE = 8;

/**
 * Exact vegetation placements (ore deposits, forageables) for the WHOLE world, one [x, z]
 * list per source. Walks every 8x8 owner page (1,764 pages), so every placement is decoded
 * exactly once. Runs on the markers worker after the location pass.
 */
export async function generateResources(
  seed: string,
  worldGenVersion: number,
  sources: string[],
  onProgress?: (done: number, total: number) => void,
  isActive: () => boolean = () => true,
): Promise<[number, number][][]> {
  const w = await getWorkers();
  const out: [number, number][][] = sources.map(() => []);
  const mask = new Uint8Array(Math.ceil(sources.length / 8)).fill(0xff);
  const pages: [number, number][] = [];
  for (let zx = ZONE_MIN; zx <= ZONE_MAX; zx += PAGE) {
    for (let zz = ZONE_MIN; zz <= ZONE_MAX; zz += PAGE) pages.push([zx, zz]);
  }
  for (const [i, [zx, zz]] of pages.entries()) {
    if (!isActive()) break;
    const res = await w.markers.request<{ data: ArrayBuffer }>({
      type: "generateResourcePage",
      seed,
      worldGenVersion,
      sourceIds: sources,
      sourceMask: mask.slice(),
      kind: 2,
      minimumZoneX: zx,
      minimumZoneZ: zz,
      zoneWidth: Math.min(PAGE, ZONE_MAX - zx + 1),
      zoneHeight: Math.min(PAGE, ZONE_MAX - zz + 1),
      cellZones: 1,
    });
    // 40-byte header (count, kind, ..., f32 origin X/Z, f32 scale X/Z), 8-byte point records
    const v = new DataView(res.data);
    const n = v.getUint32(0, true);
    const ox = v.getFloat32(24, true);
    const oz = v.getFloat32(28, true);
    const sx = v.getFloat32(32, true);
    const sz = v.getFloat32(36, true);
    for (let k = 0; k < n; k++) {
      const o = 40 + k * 8;
      out[v.getUint16(o + 4, true)]?.push([
        ox + v.getUint16(o, true) * sx,
        oz + v.getUint16(o + 2, true) * sz,
      ]);
    }
    if (i % 32 === 0 || i === pages.length - 1)
      onProgress?.(i + 1, pages.length);
  }
  return out;
}

/** Every location the game places for `seed`, streamed per catalog definition. */
export async function generateLocations(
  seed: string,
  worldGenVersion: number,
  onProgress?: (count: number) => void,
): Promise<GeneratedLocation[]> {
  const w = await getWorkers();
  const all: GeneratedLocation[] = [];
  await w.markers.request<void>(
    { type: "generateLocations", seed, worldGenVersion },
    (locations) => {
      all.push(...locations);
      onProgress?.(all.length);
    },
  );
  return all;
}
