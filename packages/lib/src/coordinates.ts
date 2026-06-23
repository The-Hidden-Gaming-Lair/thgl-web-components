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
export const buildDiscoveryLookup = (discoveredNodes: string[]) => {
  const discoveredSet = new Set(discoveredNodes);
  const discoveredCoords = new Set<string>();

  for (const id of discoveredNodes) {
    if (id.includes("@")) {
      const atIndex = id.indexOf("@");
      const coords = id.slice(atIndex + 1);
      discoveredCoords.add(coords);
      // Index the precision-normalized form too, so a node discovered at one
      // precision (e.g. a live actor at toFixed(2)) matches the same node
      // addressed at another (e.g. its full-precision static/predicted id).
      discoveredCoords.add(normalizeNodeCoords(coords));

      // Backward compatibility: old node IDs used raw float precision in z:x
      // order (from getNodeId fallback), while current extraction uses
      // .toFixed(2) in x:z order. Detect old-format IDs (>2 decimal places)
      // and also index the swapped+rounded coordinates so they match.
      const parts = coords.split(":");
      if (parts.length === 2) {
        const hasExcessPrecision = parts.some((p) => {
          const dot = p.indexOf(".");
          return dot !== -1 && p.length - dot - 1 > 2;
        });
        if (hasExcessPrecision) {
          const a = parseFloat(parts[0]);
          const b = parseFloat(parts[1]);
          if (!isNaN(a) && !isNaN(b)) {
            // Add swapped+rounded: old z:x → new x:z with .toFixed(2)
            discoveredCoords.add(`${b.toFixed(2)}:${a.toFixed(2)}`);
          }
        }
      }
    }
  }

  return {
    discoveredSet,
    discoveredCoords,
    splitCache: new Map<string, [string, string]>(),
  };
};

/**
 * Check if a node is discovered using pre-built lookup structures.
 * Matches by:
 * 1. Exact ID match
 * 2. Base ID match (type without coordinates)
 * 3. Coordinate match (for backward compatibility when type IDs change)
 */
export const checkNodeDiscovered = (
  nodeId: string,
  lookup: ReturnType<typeof buildDiscoveryLookup>,
): boolean => {
  const { discoveredSet, discoveredCoords, splitCache } = lookup;

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
  return discoveredCoords.has(normalizeNodeCoords(coords));
};
