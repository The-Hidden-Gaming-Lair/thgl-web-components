export type Region = {
  id: string;
  center: [number, number];
  border: [number, number][];
  mapName?: string;
};

export const isPointInsidePolygon = (
  point: [number, number],
  polygon: [number, number][],
) => {
  const x = point[0];
  const y = point[1];

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];

    const intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

/**
 * Per-game map<->in-game coordinate transform. A map position `p = [p0, p1]`
 * (display X = p[1], display Y = p[0]) converts to the coordinates the game
 * itself shows the player. Reproduces the historical Palworld math exactly
 * ({ scale: 459, offsetX: -158000, offsetY: 123888, round: true }); WuWa is a
 * plain `{ scale: 100 }`.
 *
 *   in-game.x = (axisX + offsetX) / scale
 *   in-game.y = (axisY + offsetY) / scale
 *
 * where axisX = p[1], axisY = p[0] normally, or swapped when `flip` is set.
 */
export type InGameCoordinates = {
  /** World units per in-game unit (divisor). */
  scale: number;
  /** Added to the map axis feeding in-game X (default 0). */
  offsetX?: number;
  /** Added to the map axis feeding in-game Y (default 0). */
  offsetY?: number;
  /** Swap which map axis feeds in-game X vs Y. */
  flip?: boolean;
  /** Emit integer in-game coordinates. */
  round?: boolean;
};

/** Map position → the coordinates the game shows the player. */
export const toInGameCoords = (
  p: [number, number] | [number, number, number],
  cfg: InGameCoordinates,
): { x: number; y: number } => {
  const axisX = cfg.flip ? p[0] : p[1];
  const axisY = cfg.flip ? p[1] : p[0];
  const x = (axisX + (cfg.offsetX ?? 0)) / cfg.scale;
  const y = (axisY + (cfg.offsetY ?? 0)) / cfg.scale;
  return cfg.round ? { x: Math.round(x), y: Math.round(y) } : { x, y };
};

/** In-game (x, y) → the map position `p = [p0, p1]` (inverse of toInGameCoords). */
export const fromInGameCoords = (
  x: number,
  y: number,
  cfg: InGameCoordinates,
): [number, number] => {
  const axisX = x * cfg.scale - (cfg.offsetX ?? 0);
  const axisY = y * cfg.scale - (cfg.offsetY ?? 0);
  return cfg.flip ? [axisX, axisY] : [axisY, axisX];
};

export type SpawnSource = "static" | "live" | "both";

export type Spawn = {
  id: string;
  name?: string | undefined;
  description?: string | undefined;
  address?: number;
  p: [number, number] | [number, number, number];
  type: string;
  cluster?: Omit<Spawn, "cluster">[];
  mapName?: string;
  color?: string;
  /**
   * Where this spawn currently came from at render time.
   * 'static' = predicted only (no live confirmation right now).
   * 'live'   = live-only (no matching static prediction).
   * 'both'   = static prediction confirmed by live tracking.
   * Absent on stored data; populated when building the rendered node list.
   */
  source?: SpawnSource;
  /**
   * Render this (predicted) spawn faded. Set when its resolved live mode is
   * `combined` — i.e. predictions shown alongside live confirmations. Distinct
   * from `source` so audio-alert logic can still skip all `source === "static"`
   * ghosts regardless of fade. See resolveLiveModeForType.
   */
  muted?: boolean;
  icon?: {
    name: string;
    url: string;
    filterId?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  } | null;
  radius?: number;
  isPrivate?: boolean;
  data?: Record<string, string[]>;
  /** Screen-space X offset in device px for spiderfied mixed-type clusters */
  spiderOffsetX?: number;
  /** Screen-space Y offset in device px for spiderfied mixed-type clusters */
  spiderOffsetY?: number;
};

export type SimpleSpawn = {
  id: string;
  p: [number, number] | [number, number, number];
  mapName?: string;
  type?: string;
  icon?:
    | string
    | {
        name: string;
        url: string;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
      }
    | null;
  name: string;
  color?: string;
  description?: string;
  data?: Record<string, string[]>;
};

export const getNodeId = (spawn: Spawn | SimpleSpawn) => {
  if (spawn.id?.includes("@")) {
    return spawn.id;
  }
  if ("type" in spawn) {
    return `${spawn.id || spawn.type}@${spawn.p[0]}:${spawn.p[1]}`;
  }
  return `${spawn.id}@${spawn.p[0]}:${spawn.p[1]}`;
};

/**
 * How a filter type participates in the "Discover Nearest Node" hotkey:
 * - `enabled`   — both predicted (static) spawns and live memory detections are
 *                 discoverable.
 * - `predicted` — only predicted/static spawns; live detections (moving memory
 *                 reads with an `address`) are skipped, so a roaming NPC/player
 *                 standing on the player can't steal the closest-node discovery.
 * - `disabled`  — the type is never targeted by the hotkey.
 */
export type DiscoverMode = "enabled" | "predicted" | "disabled";

/**
 * Filter types that have at least one *known position* in the static dataset —
 * permanent landmarks (`static: true`) and dynamic-but-predicted spawns
 * (`static: false`, e.g. resource nodes with predicted spots). Used to derive
 * the default {@link DiscoverMode}: positioned types default to `enabled` so a
 * live detection that confirms a known spot is discoverable, while purely-live
 * actor types (players, roaming NPCs with no static entry at all) default to
 * `predicted` so their *moving* detections aren't auto-discovered.
 *
 * Pass the FULL static set (e.g. `searchableNodes`), NOT the live-mode-filtered
 * render list — in live mode a `live`-resolved type's predictions are dropped
 * from the rendered nodes, but it's still a positioned (fixed) type.
 */
export const getPositionedDiscoverTypes = (
  nodes: { type: string }[],
): Set<string> => {
  const positioned = new Set<string>();
  for (const node of nodes) positioned.add(node.type);
  return positioned;
};

/**
 * Types with at least one PERMANENT (`static: true`) node — fixed landmarks like
 * effigies / chests. These are ALWAYS rendered from the static set
 * (`realStaticNodes`) in every live mode: the coordinates-provider dedup that
 * drops a predicted spawn in favour of its live actor explicitly EXEMPTS
 * permanent nodes (they're meant to always show). So the imperative live pipeline
 * must NOT also render a live twin for them, or the marker is drawn twice (and its
 * discovered alpha doubles). A live detection of a permanent type only
 * confirms/auto-discovers it — the static marker already represents its (fixed,
 * identical) position. Dynamic-static predicted types (`static: false`) are
 * excluded: they correctly hand their prediction off to the live marker.
 */
export const getPermanentTypes = (
  nodes: { type: string; static?: boolean }[],
): Set<string> => {
  const permanent = new Set<string>();
  for (const node of nodes) if (node.static) permanent.add(node.type);
  return permanent;
};

/**
 * Resolve the effective Discover-Nearest mode for a filter type. An explicit
 * per-filter user override always wins; otherwise the default follows whether
 * the type has a known position (see {@link getPositionedDiscoverTypes}). No
 * game-specific config — the existing static dataset carries the signal.
 */
export const resolveDiscoverMode = (
  type: string,
  positionedTypes: Set<string>,
  overrides: Record<string, DiscoverMode>,
): DiscoverMode =>
  overrides[type] ?? (positionedTypes.has(type) ? "enabled" : "predicted");

/**
 * Round a node-id coordinate string ("x:y", optionally with extra components)
 * to 2-decimal precision. The same physical node can be addressed at different
 * precisions depending on mode: the live-actor marker pipeline keys actors at
 * toFixed(2), while static/predicted ids carry full-precision data coords.
 * Discovery matching compares the normalized form so discovering a node in one
 * mode is recognized in the other. Distinct nodes are never within 0.01 world
 * units, so this widens no real buckets.
 */
export const normalizeNodeCoords = (coords: string): string => {
  const parts = coords.split(":");
  if (parts.length < 2) return coords;
  const x = parseFloat(parts[0]);
  const y = parseFloat(parts[1]);
  if (isNaN(x) || isNaN(y)) return coords;
  return `${x.toFixed(2)}:${y.toFixed(2)}`;
};

/**
 * Build discovery lookup structures from an array of discovered node IDs.
 * Used for O(1) lookups in hot paths like markers rendering.
 *
 * Returns:
 * - discoveredSet: Set of all discovered node IDs for exact matching
 * - discoveredCoords: Set of coordinate strings (x:y) for backward compatibility
 *   when type IDs change but coordinates remain the same
 * - splitCache: Map to cache nodeId.split("@") results to avoid repeated string ops
 */
/**
 * World-unit tolerance for matching a node's coordinate against a discovered
 * one. The SAME physical node can be addressed by two slightly different floats
 * — a live memory read vs the extracted static value — that differ by the float
 * round-trip / precision noise (e.g. ~0.03 at Palworld's ±1M magnitudes, from
 * float32 ulp). Those can round to different `toFixed(2)` strings when they
 * straddle a rounding boundary, which broke exact/normalized string matching.
 * Matching within 1 unit bridges that noise; distinct game objects are always
 * many units apart, so this never merges different nodes.
 */
export const COORD_MATCH_TOLERANCE = 1;

// Bucket key for the spatial grid; bucket size == tolerance so any point within
// tolerance of a query is in the query's cell or one of its 8 neighbours.
const coordBucketKey = (x: number, y: number): string =>
  `${Math.floor(x / COORD_MATCH_TOLERANCE)}:${Math.floor(y / COORD_MATCH_TOLERANCE)}`;

export const buildDiscoveryLookup = (discoveredNodes: string[]) => {
  const discoveredSet = new Set(discoveredNodes);
  const discoveredCoords = new Set<string>();
  // Spatial grid of discovered points for the tolerance match (see
  // COORD_MATCH_TOLERANCE). Keeps the check O(1) via a 3x3 bucket scan.
  const discoveredGrid = new Map<string, Array<[number, number]>>();
  const addPoint = (x: number, y: number) => {
    if (isNaN(x) || isNaN(y)) return;
    const key = coordBucketKey(x, y);
    const bucket = discoveredGrid.get(key);
    if (bucket) bucket.push([x, y]);
    else discoveredGrid.set(key, [[x, y]]);
  };

  for (const id of discoveredNodes) {
    if (id.includes("@")) {
      const atIndex = id.indexOf("@");
      const coords = id.slice(atIndex + 1);
      discoveredCoords.add(coords);
      // Index the precision-normalized form too, so a node discovered at one
      // precision (e.g. a live actor at toFixed(2)) matches the same node
      // addressed at another (e.g. its full-precision static/predicted id).
      discoveredCoords.add(normalizeNodeCoords(coords));

      const parts = coords.split(":");
      if (parts.length === 2) {
        const a = parseFloat(parts[0]);
        const b = parseFloat(parts[1]);
        addPoint(a, b);

        // Backward compatibility: old node IDs used raw float precision in z:x
        // order (from getNodeId fallback), while current extraction uses
        // .toFixed(2) in x:z order. Detect old-format IDs (>2 decimal places)
        // and also index the swapped coordinates so they match.
        const hasExcessPrecision = parts.some((p) => {
          const dot = p.indexOf(".");
          return dot !== -1 && p.length - dot - 1 > 2;
        });
        if (hasExcessPrecision && !isNaN(a) && !isNaN(b)) {
          discoveredCoords.add(`${b.toFixed(2)}:${a.toFixed(2)}`);
          addPoint(b, a);
        }
      }
    }
  }

  return {
    discoveredSet,
    discoveredCoords,
    discoveredGrid,
    splitCache: new Map<string, [string, string]>(),
  };
};

/**
 * True if two "x:y" coordinate strings address the same physical node — exact,
 * precision-normalized, or within {@link COORD_MATCH_TOLERANCE}. Use this for
 * one-off coordinate comparisons (e.g. removing a discovered id); the hot render
 * path uses {@link buildDiscoveryLookup}/{@link checkNodeDiscovered} instead.
 */
export const coordsMatch = (a: string, b: string): boolean => {
  if (a === b) return true;
  if (normalizeNodeCoords(a) === normalizeNodeCoords(b)) return true;
  const pa = a.split(":");
  const pb = b.split(":");
  if (pa.length < 2 || pb.length < 2) return false;
  const ax = parseFloat(pa[0]);
  const ay = parseFloat(pa[1]);
  const bx = parseFloat(pb[0]);
  const by = parseFloat(pb[1]);
  if (isNaN(ax) || isNaN(ay) || isNaN(bx) || isNaN(by)) return false;
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy <= COORD_MATCH_TOLERANCE * COORD_MATCH_TOLERANCE;
};

/**
 * Check if a node is discovered using pre-built lookup structures.
 * Matches by:
 * 1. Exact ID match
 * 2. Base ID match (type without coordinates)
 * 3. Coordinate match (backward compat + tolerance for float/precision drift)
 */
export const checkNodeDiscovered = (
  nodeId: string,
  lookup: ReturnType<typeof buildDiscoveryLookup>,
): boolean => {
  const { discoveredSet, discoveredCoords, discoveredGrid, splitCache } =
    lookup;

  // Fast path: no @ means simple ID
  if (!nodeId.includes("@")) {
    return discoveredSet.has(nodeId);
  }

  // Fast path: exact match
  if (discoveredSet.has(nodeId)) return true;

  // Get cached split or compute and cache
  let cached = splitCache.get(nodeId);
  if (!cached) {
    const atIndex = nodeId.indexOf("@");
    cached = [nodeId.slice(0, atIndex), nodeId.slice(atIndex + 1)];
    splitCache.set(nodeId, cached);
  }

  const [baseId, coords] = cached;

  // Check base ID match (type without coordinates)
  if (discoveredSet.has(baseId)) return true;

  // Check coordinate match (backward compatibility), then the precision-
  // normalized form so cross-mode (live toFixed(2) vs static full-precision)
  // ids for the same node match.
  if (discoveredCoords.has(coords)) return true;
  if (discoveredCoords.has(normalizeNodeCoords(coords))) return true;

  // Tolerance match: the same physical node can be addressed by slightly
  // different floats (live memory read vs extracted static value) that round to
  // different strings — see COORD_MATCH_TOLERANCE. Treat as discovered if any
  // discovered point lies within tolerance. Bucket size == tolerance, so the
  // 3x3 neighbourhood scan is exhaustive and O(1).
  if (discoveredGrid.size > 0) {
    const parts = coords.split(":");
    if (parts.length >= 2) {
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      if (!isNaN(x) && !isNaN(y)) {
        const bx = Math.floor(x / COORD_MATCH_TOLERANCE);
        const by = Math.floor(y / COORD_MATCH_TOLERANCE);
        const tolSq = COORD_MATCH_TOLERANCE * COORD_MATCH_TOLERANCE;
        for (let gx = bx - 1; gx <= bx + 1; gx++) {
          for (let gy = by - 1; gy <= by + 1; gy++) {
            const bucket = discoveredGrid.get(`${gx}:${gy}`);
            if (!bucket) continue;
            for (const [px, py] of bucket) {
              const dx = px - x;
              const dy = py - y;
              if (dx * dx + dy * dy <= tolSq) return true;
            }
          }
        }
      }
    }
  }

  return false;
};
