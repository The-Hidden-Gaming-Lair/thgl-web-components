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
   * Codex/database entry this marker maps to, when it differs from the spawn id
   * or the type id — e.g. games whose spawn ids are position-derived
   * (`{type}@{x}:{y}`). Set at extraction time. Absent = current behaviour: the
   * link falls back to `id ?? type`. Only used when the marker's filter value
   * declares a `dbSection`.
   */
  dbEntryId?: string;
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
  /**
   * Name of the layered interior this spawn belongs to (e.g. an underground
   * area). Set at extraction time. Its presence marks the spawn on the overworld
   * with a layer badge; the spawn is also mirrored into the "Underground" layer
   * map. Absent for ordinary surface spawns.
   */
  layer?: string;
  /** Plotted on a layer map it does NOT belong to (badge there too). */
  offLayer?: boolean;
  /** Footprint polygon in map coordinates (same space as `p`), drawn as an outline under
   * the marker - the in-game hover outline of a container or trap (Baldur's Gate EE). */
  shape?: [number, number][];
  /** Map (tiles key) this marker leads to - a door, a world-map location. The tooltip links to it. */
  mapLink?: string;
  /** Live-detection class of the actor this marker is (a Baldur's Gate EE creature file): a live
   * actor of that class on the same map takes this marker's identity. */
  liveClass?: string;
  data?: Record<string, string[]>;
  /** Screen-space X offset in device px for spiderfied mixed-type clusters */
  spiderOffsetX?: number;
  /** Screen-space Y offset in device px for spiderfied mixed-type clusters */
  spiderOffsetY?: number;
};

/**
 * The codex/database entry a marker links to (`/db/<dbSection>/<entry>`): the spawn's explicit
 * `dbEntryId`, else its id when that id IS an entry id (per-instance entries — landmarks), else
 * the type (per-type entries — a bestiary species, a named character). A POSITION-DERIVED id
 * (`{type}@{x}:{y}`, the repo's node-id format — every live actor, and the static markers of
 * games that key spawns by position) never names an entry, so it is skipped: the live Mirto
 * marker `glossary_character_mirto@259128.72:373001.97` links to `glossary_character_mirto`.
 */
export function dbEntryIdOf(
  spawn: {
    dbEntryId?: string | undefined;
    id?: string | undefined;
    type: string;
  },
  // Type-level default from the filter value's `dbEntryId` — names the entry for every spawn of
  // the type (incl. live actors, which carry no per-spawn `dbEntryId`) when it differs from the type id.
  typeDbEntryId?: string,
): string {
  // `""` is NO_DB_ENTRY: a deliberate "this marker has no codex entry" — no link.
  if (spawn.dbEntryId !== undefined) return spawn.dbEntryId;
  // The coordinates provider normalises id-less spawns to `id: spawn.id ?? node.type`, so an id
  // equal to the type is no own id — fall through to the type-level default.
  if (
    spawn.id &&
    spawn.id !== spawn.type &&
    !spawn.id.startsWith(`${spawn.type}@`)
  )
    return spawn.id;
  return typeDbEntryId ?? spawn.type;
}

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
  /** A pre-resolved literal display label. When set, the marker tooltip shows it
   *  verbatim instead of translating `name` as a dict key — for embeds that ship
   *  a sliced client dict without the full game terms. */
  label?: string;
  /** Pre-resolved display name of `type`, for the same sliced-dict embeds. */
  typeLabel?: string;
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
 *
 * Pass `typesIdMap` to also count live-only VARIANT types as positioned when
 * their base class is (see {@link collectVariantBaseTypes}).
 */
export const getPositionedDiscoverTypes = (
  nodes: { type: string }[],
  typesIdMap?: Record<string, string> | null,
): Set<string> => {
  const positioned = new Set<string>();
  for (const node of nodes) positioned.add(node.type);
  for (const [type, bases] of collectVariantBaseTypes(typesIdMap)) {
    if (!positioned.has(type) && bases.some((base) => positioned.has(base)))
      positioned.add(type);
  }
  return positioned;
};

/**
 * Live-only VARIANT filter types → their base filter types. A
 * `<Class>_Variant.<Id>` actor (Palia star-quality / infected forage, Palworld
 * lucky pals) spawns at the same fixed spots as `<Class>`, but its own filter
 * type has no static nodes of its own. The base type is the typesIdMap entry
 * of `<Class>`; a variant type that several classes share (Palworld
 * `lucky_pal`) has several bases. A variant mapped to its base type itself is
 * no variant type. One derivation for auto-discover, the respawn reset
 * (getPositionedDiscoverTypes) and the discovered matcher's filter-type gate.
 */
export const collectVariantBaseTypes = (
  typesIdMap?: Record<string, string> | null,
): Map<string, string[]> => {
  const bases = new Map<string, string[]>();
  if (!typesIdMap) return bases;
  for (const [classId, type] of Object.entries(typesIdMap)) {
    const variantIndex = classId.indexOf("_Variant.");
    if (variantIndex === -1) continue;
    const baseType = typesIdMap[classId.slice(0, variantIndex)];
    if (!baseType || baseType === type) continue;
    const list = bases.get(type);
    if (!list) bases.set(type, [baseType]);
    else if (!list.includes(baseType)) list.push(baseType);
  }
  return bases;
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

// ---------------------------------------------------------------------------
// Discovered marks
//
// A stored mark (`discoveredNodes`) is the id of the marker that was ticked:
// `<id or type>@<x>:<y>`, an addressed id like `q_1101010@1101010s1g1`, or a
// bare id (`iron_ore`, a game-reported `e55542889`). A marker counts as
// discovered when a mark is its own id, its bare base id, an old alias of it,
// or — to bridge two ids of ONE node (live actor id vs static id, an id from
// before a type rename, an old raw-float id) — a mark at the same coordinates.
// The coordinate matches never join two different current markers (see
// crossIdAllowed and the known static ids below).
// ---------------------------------------------------------------------------

/**
 * A real number as JavaScript prints it: optional minus, digits with an
 * optional fraction, optional exponent (`9.999999974752427e-7` occurs in the
 * Infinity Nikki data). `parseFloat` alone is too loose: it reads the event id
 * `1_74` as 1 and `1102010s1g1` as 1102010.
 */
const COORD_NUMBER = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

/**
 * The coordinates in the part of a node id after `@` ("x:y", or "x:y:i" where
 * the third part is part of the identity, e.g. Crimson Desert
 * `faction_quest@x:y:0`/`:1`/`:2`). Null unless there are at least two
 * ":"-parts and EVERY part is a real number: Welcome to Elderfield
 * `monster@1_74:0` or AION 2 `q_1101010@1101010s1g1` are names, not positions.
 */
export const parseNodeCoords = (coords: string): number[] | null => {
  const parts = coords.split(":");
  if (parts.length < 2) return null;
  for (const part of parts) if (!COORD_NUMBER.test(part)) return null;
  return parts.map(Number);
};

/**
 * Round a node-id coordinate string to 2-decimal precision, every component
 * (a third component stays: it tells apart several nodes at one spot). The
 * same physical node can be addressed at different precisions depending on
 * mode: the live-actor marker pipeline keys actors at toFixed(2), while
 * static/predicted ids carry full-precision data coords. Discovery matching
 * compares the normalized form so discovering a node in one mode is recognized
 * in the other. Returns the input unchanged when it is not strictly numeric
 * (see {@link parseNodeCoords}).
 */
export const normalizeNodeCoords = (coords: string): string => {
  const parsed = parseNodeCoords(coords);
  return parsed ? parsed.map((v) => v.toFixed(2)).join(":") : coords;
};

/**
 * World-unit tolerance for matching a node's coordinate against a discovered
 * one. The SAME physical node can be addressed by two slightly different floats
 * — a live memory read vs the extracted static value — that differ by the float
 * round-trip / precision noise (e.g. ~0.03 at Palworld's ±1M magnitudes, from
 * float32 ulp). Those can round to different `toFixed(2)` strings when they
 * straddle a rounding boundary, which broke exact/normalized string matching.
 * Matching within 1 unit bridges that noise. Distinct markers CAN be closer
 * than that (Dune pickups, Palworld ores next to trees), which is why the
 * tolerance match only joins two ids of one node (see crossIdAllowed).
 */
export const COORD_MATCH_TOLERANCE = 1;

// Bucket key for the spatial grid; bucket size == tolerance so any point within
// tolerance of a query is in the query's cell or one of its 8 neighbours.
const coordBucketKey = (x: number, y: number): string =>
  `${Math.floor(x / COORD_MATCH_TOLERANCE)}:${Math.floor(y / COORD_MATCH_TOLERANCE)}`;

// ---------------------------------------------------------------------------
// Open choices (owner). Each is one constant; flipping it switches the rule.
// ---------------------------------------------------------------------------

/**
 * CHOICE 1 — may two CURRENT static markers of the SAME filter match each
 * other by position (same coordinates / 2-decimal form / within 1 unit)?
 * - false (1a, active): never. Two spawns are two markers, also within one
 *   filter (two iron ores 0.4 apart are ticked one by one).
 * - true (1b): yes within one filter type, as on origin/main; never across
 *   filters.
 */
const STATIC_SAME_FILTER_POSITION_MATCH = false;

/**
 * CHOICE 2 — which old `<id>@<x>:<y>` marks (stored by "Discover all" before
 * web PR #23 for a spawn whose id already had "@") stand for `<id>`?
 * - true (2a, active): every one whose text after the LAST "@" is two numbers.
 * - false (2b): only when `<id>` itself is `type@x:y` (its text after its first
 *   "@" is numeric); marks of other addressed ids (AION 2
 *   `q_…@1101010s1g1@x:y`, Albion `zone@world:1000@x:y`, Diablo 4
 *   `campaignQuests:…@-75.57,120.57@x:y`) then stay unmatched, as on
 *   origin/main.
 */
const OLD_MARK_ALIAS_FOR_EVERY_ID = true;

/**
 * CHOICE 3 — the filter-type gate in {@link crossIdAllowed}: when one side of
 * a coordinate match is a current static marker and the other is not (a live
 * actor id, an id from older data, a mark made on another map), the other
 * side must not name a DIFFERENT filter of the game by its base id (a live
 * `copper_ore@…` mark is the copper ore's, not the iron ore's 0.4 units
 * away). Likewise two ids that are both not current (a live actor and a live
 * mark) do not match when their base ids are two different filters of the
 * game. A live-only variant filter counts as its base filter (Palia
 * `garlic_star` is a `garlic`, see {@link collectVariantBaseTypes}).
 * - true (3a, active): gate on.
 * - false (3b, design "R1"): any non-current id matches any marker at its
 *   position.
 */
const OLD_ID_FILTER_TYPE_GATE = true;

// ---------------------------------------------------------------------------
// Known static ids of the loaded map
// ---------------------------------------------------------------------------

/**
 * The static markers of the loaded map: every id a static spawn is addressed by
 * ({@link getNodeId} and {@link getSpawnDiscoveryId}) → its filter type. Set by
 * the CoordinatesProvider next to the done-when-all rules.
 *
 * Why: the coordinate matches exist to bridge two ids of ONE node. Two ids
 * that are both CURRENT static ids are two different markers, so a mark of one
 * never marks the other by position. Without this, "Discover all" on one filter
 * greyed every other filter's marker within 1 unit, and "Undiscover all"
 * deleted those markers' own marks.
 *
 * Empty (no CoordinatesProvider on the page, e.g. the guide-page progress
 * list, or the map's nodes are not loaded yet): which ids are markers is
 * unknown, so a coordinate match only joins two ids with the same base (text
 * before "@"): a live `iron_ore@…` read and the static `iron_ore@…`, an old
 * raw-float id of the same type. Never two filters' ids (see crossIdAllowed).
 */
export type KnownNodes = {
  /** id → filter type; null when one id is listed under several filters
   *  (Dune Awakening: 18,983 pickups), then the type gate passes. */
  ids: ReadonlyMap<string, string | null>;
  /** The filter types the gate knows: every filter of the game (marks made on
   *  another map, live-only types) and the types of the loaded map's static
   *  spawns. */
  types: ReadonlySet<string>;
  /** Variant filter type without static spawns on the loaded map → its base
   *  types ({@link collectVariantBaseTypes}); the gate counts such a variant
   *  as its base. */
  variantBases?: ReadonlyMap<string, readonly string[]>;
};

// The known ids of the markers currently loaded. Module state like the
// done-when-all rules below, for the same reason: discovered checks run in
// many places that only know a node id. Set client-side only (the
// CoordinatesProvider skips it during SSR), so it never leaks between tenants
// on the server.
const NO_KNOWN_NODES: KnownNodes = { ids: new Map(), types: new Set() };
let knownNodes: KnownNodes = NO_KNOWN_NODES;

type KnownNodeSet = {
  type: string;
  spawns: {
    id?: string;
    isPrivate?: boolean;
    p: [number, number] | [number, number, number];
  }[];
}[];

/** What {@link collectKnownNodeIds} needs of the game's config. */
export type KnownNodeOptions = {
  /** The game's filters (every filter value id joins the gate). */
  filters?: readonly { values: readonly { id: string }[] }[];
  /** The game's typesIdMap (variant filter types → base types). */
  typesIdMap?: Record<string, string> | null;
};

const buildKnownNodes = (
  nodes: KnownNodeSet,
  opts: KnownNodeOptions | undefined,
): KnownNodes => {
  const ids = new Map<string, string | null>();
  const types = new Set<string>();
  if (opts?.filters)
    for (const filter of opts.filters)
      for (const value of filter.values) types.add(value.id);
  const add = (id: string, type: string) => {
    const had = ids.get(id);
    ids.set(id, had === undefined || had === type ? type : null);
  };
  addNodeSetIds(nodes, add, types);
  // A variant counts as its base only where it is live-only: a variant filter
  // with static spawns on this map (Palworld `egg_common_large`, Palia
  // `….Magical` trees) is a filter of its own here, and a live mark of it
  // must not grey its base's marker next to it (CHOICE 3).
  const variantBases = collectVariantBaseTypes(opts?.typesIdMap);
  for (const node of nodes)
    if (node.spawns.length > 0) variantBases.delete(node.type);
  return { ids, types, variantBases };
};

/** Adds both ids every spawn of `nodes` is addressed by, and its type. */
const addNodeSetIds = (
  nodes: KnownNodeSet,
  add: (id: string, type: string) => void,
  types: Set<string>,
): void => {
  for (const node of nodes) {
    for (const spawn of node.spawns) {
      types.add(node.type);
      // getNodeId's derivation, for a spawn that has not been normalized yet.
      const sid = spawn.id || node.type;
      const nodeId = sid.includes("@")
        ? sid
        : `${sid}@${spawn.p[0]}:${spawn.p[1]}`;
      add(nodeId, node.type);
      // getSpawnDiscoveryId gives the same id unless the id is empty, the
      // type stands in for a missing id and has "@", or the spawn is private
      // (its bare id).
      const discoveryId = getSpawnDiscoveryId(node.type, spawn);
      if (discoveryId !== nodeId) add(discoveryId, node.type);
    }
  }
};

/**
 * The user's own markers (My Filters): every id a custom marker is addressed
 * by ({@link getNodeId} `<id>@<x>:<y>` on the map, the bare id in the filter
 * counts and Discover all) → its custom filter name. Set by the
 * CoordinatesProvider apart from the static ids, so editing a custom marker
 * does not rebuild the static registry. A custom marker counts as a current
 * marker: a tick of it never greys a static marker 1 unit away, and a mark of
 * a static marker never greys it. The custom filter names join the gate.
 */
export type PrivateNodes = {
  ids: ReadonlyMap<string, string | null>;
  types: ReadonlySet<string>;
};

const NO_PRIVATE_NODES: PrivateNodes = { ids: new Map(), types: new Set() };
let privateNodes: PrivateNodes = NO_PRIVATE_NODES;

/** Collects the ids of the user's custom markers (see {@link PrivateNodes}). */
export const collectPrivateNodeIds = (nodes: KnownNodeSet): PrivateNodes => {
  const ids = new Map<string, string | null>();
  const types = new Set<string>();
  addNodeSetIds(
    nodes,
    (id, type) => {
      const had = ids.get(id);
      ids.set(id, had === undefined || had === type ? type : null);
    },
    types,
  );
  return { ids, types };
};

/** Replaces the custom marker ids (bumps the discovery rules version). */
export const setPrivateNodeIds = (nodes: PrivateNodes): void => {
  if (nodes === privateNodes) return;
  privateNodes = nodes;
  discoveryRulesVersion++;
};

/** Empties the custom marker ids if they are still `nodes` (provider unmount). */
export const clearPrivateNodeIds = (nodes: PrivateNodes): void => {
  if (privateNodes === nodes) setPrivateNodeIds(NO_PRIVATE_NODES);
};

/** Filter type of a current marker id (static or custom); undefined if none. */
const currentTypeOf = (id: string): string | null | undefined => {
  const type = knownNodes.ids.get(id);
  if (type !== undefined || privateNodes.ids.size === 0) return type;
  return privateNodes.ids.get(id);
};

/** Is `type` a filter type the gate knows (a game filter or a custom one)? */
const isGateType = (type: string): boolean =>
  knownNodes.types.has(type) ||
  (privateNodes.types.size > 0 && privateNodes.types.has(type));

/**
 * Collects the known static ids of a node set (see {@link KnownNodes}), with
 * the game's filters and typesIdMap for the filter-type gate (without them
 * the gate only knows the node set's own types).
 * Built on first use: only a coordinate match reads them, so a user without
 * marks near the map's markers never pays for it (~200 ms on a 355k-spawn Dune
 * Awakening map, ~100 ms on Pax Dei).
 */
export const collectKnownNodeIds = (
  nodes: KnownNodeSet,
  opts?: KnownNodeOptions,
): KnownNodes => {
  let built: KnownNodes | null = null;
  const get = () => (built ??= buildKnownNodes(nodes, opts));
  return {
    get ids() {
      return get().ids;
    },
    get types() {
      return get().types;
    },
    get variantBases() {
      return get().variantBases;
    },
  };
};

/** Replaces the known static ids (bumps the discovery rules version). */
export const setKnownNodeIds = (known: KnownNodes): void => {
  if (known === knownNodes) return;
  knownNodes = known;
  discoveryRulesVersion++;
};

/**
 * Empties the known static ids if they are still `known` (the provider that
 * set them unmounts). A newer set, from a provider that rendered in the
 * meantime, stays. Without this a page without a map (guide page) would use
 * the ids of the map the user came from.
 */
export const clearKnownNodeIds = (known: KnownNodes): void => {
  if (knownNodes === known) setKnownNodeIds(NO_KNOWN_NODES);
};

// ---------------------------------------------------------------------------
// Lookup and matching
// ---------------------------------------------------------------------------

/** A stored mark, as the coordinate indexes keep it. */
type MarkEntry = {
  /** The stored string. */
  mark: string;
  /** The id the mark stands for: the mark, or for an old `<id>@x:y` mark of
   *  an id with "@" that id. */
  id: string;
  /** Entry is the swapped (legacy z:x) reading of the mark. */
  swapped?: boolean;
  /** Entry is the 2-decimal x:y of a 3-part mark; stands in only for an id that is not a current marker (a live actor). */
  projected?: boolean;
};
type MarkPoint = [x: number, y: number, entry: MarkEntry];

/** A queried node id, split once per lookup (see `splitCache`). */
type SplitNodeId = {
  base: string;
  coords: string;
  /** {@link parseNodeCoords} of `coords`. */
  parsed: number[] | null;
  /** {@link normalizeNodeCoords} of `coords`. */
  normalized: string;
};

/**
 * Build discovery lookup structures from the stored marks. Used for O(1)
 * lookups in hot paths like markers rendering.
 *
 * Returns:
 * - discoveredSet: every stored mark, for exact and base-id matches
 * - aliases: id → old marks that stand for it. Before web PR #23, "Discover
 *   all" stored `<id>@<x>:<y>` for a spawn whose id already had "@"
 *   (`q_1101010@1101010s1g1@x:y`, `valheim_ore@1:2@1:2`); the text before the
 *   last "@" is that spawn's id (see CHOICE 2).
 * - discoveredCoords: coordinate string (as stored, 2-decimal form, swapped
 *   legacy form) → marks carrying it, for renamed types and cross-precision ids
 * - discoveredGrid: spatial grid of the marks' points for the tolerance match
 * - splitCache: queried node id → its parts, to avoid repeated string ops
 */
export const buildDiscoveryLookup = (discoveredNodes: string[]) => {
  const discoveredSet = new Set(discoveredNodes);
  const aliases = new Map<string, string[]>();
  const discoveredCoords = new Map<string, MarkEntry[]>();
  const discoveredGrid = new Map<string, MarkPoint[]>();
  const addCoords = (key: string, entry: MarkEntry) => {
    const list = discoveredCoords.get(key);
    if (list) list.push(entry);
    else discoveredCoords.set(key, [entry]);
  };
  const addPoint = (x: number, y: number, entry: MarkEntry) => {
    const key = coordBucketKey(x, y);
    const bucket = discoveredGrid.get(key);
    if (bucket) bucket.push([x, y, entry]);
    else discoveredGrid.set(key, [[x, y, entry]]);
  };

  for (const mark of discoveredNodes) {
    const atIndex = mark.indexOf("@");
    if (atIndex === -1) continue;
    let id = mark;
    let tail = mark.slice(atIndex + 1);
    let coords = parseNodeCoords(tail);
    const lastAt = mark.lastIndexOf("@");
    if (lastAt !== atIndex) {
      const lastTail = mark.slice(lastAt + 1);
      const lastCoords = parseNodeCoords(lastTail);
      const prefix = mark.slice(0, lastAt);
      if (lastCoords && lastCoords.length === 2 && isOldMarkPrefix(prefix)) {
        id = prefix;
        const list = aliases.get(id);
        if (list) list.push(mark);
        else aliases.set(id, [mark]);
        tail = lastTail;
        coords = lastCoords;
      }
    }
    const entry: MarkEntry = { mark, id };
    // The coordinate text as stored: renamed types keep it (also for
    // non-numeric tails like Elderfield's `1_74:0`).
    addCoords(tail, entry);
    if (!coords) continue;
    // The precision-normalized form, so a node discovered at one precision
    // (a live actor at toFixed(2)) matches the same node addressed at another
    // (its full-precision static/predicted id).
    addCoords(normalizeNodeCoords(tail), entry);
    // A third number is part of the identity, but a live id is
    // `type@x.toFixed(2):y.toFixed(2)`: index the mark's 2-decimal x:y too, so
    // a tick of the static marker still greys its live marker (as before the
    // strict match). Only for an id that is not a current marker (see
    // crossIdAllowed); not in the grid and without a swapped reading.
    if (coords.length > 2)
      addCoords(`${coords[0].toFixed(2)}:${coords[1].toFixed(2)}`, {
        mark,
        id,
        projected: true,
      });
    if (coords.length !== 2) continue;
    const [a, b] = coords;
    addPoint(a, b, entry);
    // Backward compatibility: old node IDs used raw float precision in z:x
    // order (getNodeId fallback), current extraction uses .toFixed(2) in x:z
    // order. Index the swapped reading of an id with >2 decimals; it only
    // counts for a mark that is not a current id (see crossIdAllowed).
    const hasExcessPrecision = tail.split(":").some((p) => {
      const dot = p.indexOf(".");
      return dot !== -1 && p.length - dot - 1 > 2 && !/e/i.test(p);
    });
    if (hasExcessPrecision) {
      const swapped: MarkEntry = { mark, id, swapped: true };
      addCoords(`${b.toFixed(2)}:${a.toFixed(2)}`, swapped);
      addPoint(b, a, swapped);
    }
  }

  return {
    discoveredSet,
    aliases,
    discoveredCoords,
    discoveredGrid,
    splitCache: new Map<string, SplitNodeId>(),
  };
};

type DiscoveryLookup = ReturnType<typeof buildDiscoveryLookup>;

/** CHOICE 2: does the text before the last "@" of an old mark name its id? */
const isOldMarkPrefix = (prefix: string): boolean =>
  OLD_MARK_ALIAS_FOR_EVERY_ID ||
  parseNodeCoords(prefix.slice(prefix.indexOf("@") + 1)) !== null;

const baseOf = (id: string): string => {
  const at = id.indexOf("@");
  return at === -1 ? id : id.slice(0, at);
};

/**
 * Are two filter types one family for the gate: the same type, or a live-only
 * variant type and its base (Palia `garlic_star` and `garlic`), or two
 * variants of one base? family(t) = the variant's base types, else t itself.
 */
const sameFamily = (a: string, b: string): boolean => {
  if (a === b) return true;
  const bases = knownNodes.variantBases;
  if (!bases || bases.size === 0) return false;
  const fa = bases.get(a);
  const fb = bases.get(b);
  if (!fa) return fb !== undefined && fb.includes(a);
  if (!fb) return fa.includes(b);
  for (const base of fa) if (fb.includes(base)) return true;
  return false;
};

/**
 * CHOICE 3, the filter-type gate: one side of a coordinate match is the current
 * static id `knownId` of filter `knownType`, the other side `otherId` is not a
 * current id. Allowed unless `otherId`'s base names a different filter of the
 * game (a variant counts as its base filter, see {@link sameFamily}).
 */
const otherIdFitsStaticMarker = (
  knownId: string,
  knownType: string | null,
  otherId: string,
): boolean => {
  // One id listed under several filters: no single filter to compare with.
  if (knownType === null) return true;
  const otherBase = baseOf(otherId);
  return (
    !isGateType(otherBase) ||
    sameFamily(otherBase, knownType) ||
    otherBase === baseOf(knownId)
  );
};

/**
 * May a coordinate match (not exact id / base id / alias) join node id `q` and
 * the mark `entry`? Only when they can be two ids of ONE node:
 * - at least one of them is not a current static id (a live actor id, an id
 *   from an older data version) — CHOICE 1 for two current ids of one filter;
 * - if one is a current static id, the other does not name a DIFFERENT filter
 *   of the game by its base id (CHOICE 3);
 * - a swapped legacy reading only counts for a mark that is not a current id;
 * - if neither is a current static id (a live actor vs a live mark), they do
 *   not name two different filters of the game by their base ids (CHOICE 3).
 * A live-only variant filter counts as its base filter for both checks. The
 * user's custom markers count as current ids too (see {@link PrivateNodes}).
 * With no static ids registered (see {@link KnownNodes}) only two ids with the
 * same base match.
 */
const crossIdAllowed = (q: string, entry: MarkEntry): boolean => {
  if (knownNodes.ids.size === 0) return baseOf(q) === baseOf(entry.id);
  const markType = currentTypeOf(entry.id);
  // A swapped (legacy z:x) reading only exists for old ids.
  if (entry.swapped && markType !== undefined) return false;
  const qType = currentTypeOf(q);
  // The projected x:y of a 3-part mark never joins two current markers.
  if (entry.projected && qType !== undefined) return false;
  if (qType !== undefined && markType !== undefined)
    // Two current static ids are two markers (CHOICE 1).
    return (
      STATIC_SAME_FILTER_POSITION_MATCH && qType !== null && qType === markType
    );
  if (!OLD_ID_FILTER_TYPE_GATE) return true;
  if (qType === undefined && markType === undefined) {
    const qBase = baseOf(q);
    const markBase = baseOf(entry.id);
    return (
      !isGateType(qBase) || !isGateType(markBase) || sameFamily(qBase, markBase)
    );
  }
  return qType !== undefined
    ? otherIdFitsStaticMarker(q, qType, entry.id)
    : otherIdFitsStaticMarker(entry.id, markType ?? null, q);
};

/** Called per matching mark; returns true to stop the scan. */
type MarkVisitor = (mark: string) => boolean;
const stopAtFirstMark: MarkVisitor = () => true;

const visitCoordEntries = (
  nodeId: string,
  entries: MarkEntry[] | undefined,
  visit: MarkVisitor,
): boolean => {
  if (!entries) return false;
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (
      entry.mark !== nodeId &&
      crossIdAllowed(nodeId, entry) &&
      visit(entry.mark)
    )
      return true;
  }
  return false;
};

/**
 * Visits the stored marks that make `nodeId` discovered (rules 1-3 of
 * {@link checkNodeDiscovered}): exact id, an old alias mark, the bare base id
 * (text before "@"), then the coordinate matches {@link crossIdAllowed} lets
 * through. Returns true as soon as `visit` returns true. Allocates nothing on
 * the discovered-check path except the per-lookup split cache entry.
 */
const scanMatchingMarks = (
  nodeId: string,
  lookup: DiscoveryLookup,
  visit: MarkVisitor,
): boolean => {
  const { discoveredSet, aliases, discoveredCoords, discoveredGrid } = lookup;
  if (discoveredSet.size === 0) return false;
  if (discoveredSet.has(nodeId) && visit(nodeId)) return true;
  if (aliases.size > 0) {
    const old = aliases.get(nodeId);
    if (old) for (const mark of old) if (visit(mark)) return true;
  }
  if (!nodeId.includes("@")) return false;
  // No mark has coordinates: only the base id can match (no split needed).
  if (discoveredCoords.size === 0) {
    const base = nodeId.slice(0, nodeId.indexOf("@"));
    return discoveredSet.has(base) && visit(base);
  }

  let split = lookup.splitCache.get(nodeId);
  if (!split) {
    const atIndex = nodeId.indexOf("@");
    const coords = nodeId.slice(atIndex + 1);
    const parsed = parseNodeCoords(coords);
    split = {
      base: nodeId.slice(0, atIndex),
      coords,
      parsed,
      normalized: parsed ? parsed.map((v) => v.toFixed(2)).join(":") : coords,
    };
    lookup.splitCache.set(nodeId, split);
  }
  const { base, coords, parsed, normalized } = split;

  // Base ID match (type without coordinates)
  if (discoveredSet.has(base) && visit(base)) return true;

  // Coordinate match: the coordinates as stored (renamed type), then the
  // precision-normalized form (live toFixed(2) vs static full precision).
  if (visitCoordEntries(nodeId, discoveredCoords.get(coords), visit))
    return true;
  if (!parsed) return false;
  if (
    normalized !== coords &&
    visitCoordEntries(nodeId, discoveredCoords.get(normalized), visit)
  )
    return true;

  // Tolerance match (see COORD_MATCH_TOLERANCE). Bucket size == tolerance, so
  // the 3x3 neighbourhood scan is exhaustive and O(1).
  if (discoveredGrid.size > 0) {
    const x = parsed[0];
    const y = parsed[1];
    const bx = Math.floor(x / COORD_MATCH_TOLERANCE);
    const by = Math.floor(y / COORD_MATCH_TOLERANCE);
    const tolSq = COORD_MATCH_TOLERANCE * COORD_MATCH_TOLERANCE;
    for (let gx = bx - 1; gx <= bx + 1; gx++) {
      for (let gy = by - 1; gy <= by + 1; gy++) {
        const bucket = discoveredGrid.get(`${gx}:${gy}`);
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          const [px, py, entry] = bucket[i];
          const dx = px - x;
          const dy = py - y;
          if (
            dx * dx + dy * dy <= tolSq &&
            entry.mark !== nodeId &&
            crossIdAllowed(nodeId, entry) &&
            visit(entry.mark)
          )
            return true;
        }
      }
    }
  }
  return false;
};

/** Rules 1-3 of {@link checkNodeDiscovered}: the node's own discovered state. */
const matchesDiscovered = (nodeId: string, lookup: DiscoveryLookup): boolean =>
  scanMatchingMarks(nodeId, lookup, stopAtFirstMark);

/**
 * "Done when all": a marker that stands for several things (e.g. one quest
 * giver marker for all quests that NPC hands out) counts as discovered when
 * EVERY id it lists is discovered.
 *
 * Wire contract (data-forge): the spawn's existing `data` field carries
 * `data.doneWhenAll = ["q_1101010", "q_1101020"]`. Each listed id is matched
 * with the normal discovered rules (exact id, base id before `@`, coordinates),
 * so a bare `q_1101010` from `characterData.collectedNodeIds` satisfies it. The
 * marker is discovered if it is discovered itself OR all listed ids are; an
 * empty list never counts as done. Description templates ignore the key (no
 * `{{doneWhenAll}}` placeholder uses it).
 */
export const DONE_WHEN_ALL_KEY = "doneWhenAll";

/** Node ids of the loaded markers → the ids that must all be discovered. */
export type DoneWhenAllRules = ReadonlyMap<string, readonly string[]>;

/**
 * Collects the done-when-all rules of a node set. Each rule is keyed by both
 * ids a spawn is addressed by: {@link getNodeId} (markers, tooltips, the
 * discovered toggle) and {@link getSpawnDiscoveryId} (filter counts, discover
 * all). Both keep an id that contains `@` unchanged, so for those spawns the
 * two keys are the same; they still differ for a private spawn without `@` and
 * for a spawn without an id (`getNodeId` falls back to the type on an empty
 * id, `getSpawnDiscoveryId` only on a missing one).
 */
export const collectDoneWhenAllRules = (
  nodes: {
    type: string;
    spawns: {
      id?: string;
      isPrivate?: boolean;
      p: [number, number] | [number, number, number];
      data?: Record<string, string[]>;
    }[];
  }[],
): Map<string, string[]> => {
  const rules = new Map<string, string[]>();
  for (const node of nodes) {
    for (const spawn of node.spawns) {
      const required = spawn.data?.[DONE_WHEN_ALL_KEY];
      if (!Array.isArray(required) || required.length === 0) continue;
      const ids = required.filter(
        (id): id is string => typeof id === "string" && id.length > 0,
      );
      if (ids.length === 0) continue;
      // getNodeId's derivation, for a spawn that has not been normalized yet.
      const sid = spawn.id || node.type;
      const nodeId = sid.includes("@")
        ? sid
        : `${sid}@${spawn.p[0]}:${spawn.p[1]}`;
      rules.set(nodeId, ids);
      rules.set(getSpawnDiscoveryId(node.type, spawn), ids);
    }
  }
  return rules;
};

// The rules of the markers currently loaded. Discovered checks run in many
// places that only know a node id (store selector, tooltips, counts), so the
// rules live next to the matcher instead of being threaded through every
// caller. Set by the CoordinatesProvider whenever its static nodes change.
let doneWhenAllRules: DoneWhenAllRules = new Map();
// Bumped when the done-when-all rules or the known static ids change.
let discoveryRulesVersion = 0;

const sameRules = (a: DoneWhenAllRules, b: DoneWhenAllRules): boolean => {
  if (a.size !== b.size) return false;
  for (const [key, ids] of a) {
    const other = b.get(key);
    if (!other || other.length !== ids.length) return false;
    for (let i = 0; i < ids.length; i++) if (ids[i] !== other[i]) return false;
  }
  return true;
};

/** Replaces the active done-when-all rules (no-op when unchanged). */
export const setDoneWhenAllRules = (rules: DoneWhenAllRules): void => {
  if (sameRules(rules, doneWhenAllRules)) return;
  doneWhenAllRules = rules;
  discoveryRulesVersion++;
};

/**
 * Bumped whenever the discovery rules change — the done-when-all rules or the
 * known static ids — so result caches keyed only on `discoveredNodes`
 * (settings.isDiscoveredNode / isAutoDiscoveredNode) know to rebuild.
 */
export const getDoneWhenAllVersion = (): number => discoveryRulesVersion;

/**
 * True when `nodeId` has a done-when-all rule and every listed id is
 * discovered. Pure: the rules are passed in.
 */
export const isDoneWhenAll = (
  nodeId: string,
  rules: DoneWhenAllRules,
  lookup: DiscoveryLookup,
): boolean => {
  if (rules.size === 0) return false;
  const required = rules.get(nodeId);
  if (!required || required.length === 0) return false;
  return required.every((id) => matchesDiscovered(id, lookup));
};

/**
 * Focus-gated markers: spawns whose visibility follows the live focus of the
 * companion app (`useGameState.highlightSpawnIDs` / `liveFocusActive`, see
 * live-focus.ts). Wire contract (data-forge), in the spawn's `data`:
 * - `focusMode = ["only"]`: shown only while focused (AION 2 quest objective
 *   and turn-in markers);
 * - `focusMode = ["live"]`: shown while live focus is NOT active (web, no app,
 *   game closed); while it is active, shown only when focused (AION 2 quest
 *   givers: only the ones with a quest the character can take now);
 * - `focusWhenAny = ["q_1202051", ...]`: the spawn also counts as focused when
 *   any of these ids is in the focus set.
 * Any other `focusMode` value, or none, leaves the spawn as before. Description
 * templates ignore the keys (no `{{focusMode}}` placeholder uses them).
 */
export const FOCUS_MODE_KEY = "focusMode";
export const FOCUS_WHEN_ANY_KEY = "focusWhenAny";

/** The spawn's focus mode, or undefined when it is not focus-gated. */
export const getFocusMode = (
  data: Record<string, string[]> | undefined,
): "only" | "live" | undefined => {
  const mode = data?.[FOCUS_MODE_KEY]?.[0];
  return mode === "only" || mode === "live" ? mode : undefined;
};

/**
 * True when the spawn is focused: its node id ({@link getNodeId}) is in
 * `focused`, or any id of its `data.focusWhenAny` is. No allocations.
 */
export const isSpawnFocused = (
  nodeId: string,
  data: Record<string, string[]> | undefined,
  focused: ReadonlySet<string> | null,
): boolean => {
  if (!focused || focused.size === 0) return false;
  if (focused.has(nodeId)) return true;
  const any = data?.[FOCUS_WHEN_ANY_KEY];
  if (!Array.isArray(any)) return false;
  for (let i = 0; i < any.length; i++) if (focused.has(any[i])) return true;
  return false;
};

/**
 * Whether the static map shows a spawn (the filter + focus part of
 * `processNodes`; global filters and live-mode suppression are separate):
 * 1. the selected marker always shows, even with its filter off;
 * 2. a switched-off filter hides its spawns, focused ones too;
 * 3. no focus mode → shown; `only` → shown when focused; `live` → shown when
 *    live focus is inactive, else only when focused.
 */
export const isSpawnShownByFocus = (
  nodeId: string,
  data: Record<string, string[]> | undefined,
  state: {
    filterOn: boolean;
    selectedNodeId?: string | null;
    focused: ReadonlySet<string> | null;
    liveFocusActive: boolean;
  },
): boolean => {
  if (state.selectedNodeId && nodeId === state.selectedNodeId) return true;
  if (!state.filterOn) return false;
  const mode = getFocusMode(data);
  if (mode === undefined) return true;
  if (mode === "live" && !state.liveFocusActive) return true;
  return isSpawnFocused(nodeId, data, state.focused);
};

/**
 * Check if a node is discovered using pre-built lookup structures.
 * Matches by:
 * 1. Exact ID match, or an old `<id>@x:y` mark of the id (alias)
 * 2. Base ID match (type without coordinates)
 * 3. Coordinate match (renamed type, live vs static precision, tolerance for
 *    float drift, legacy z:x order) — only between two ids of one node, see
 *    crossIdAllowed
 * 4. Done when all: the node lists ids that are all discovered
 *    (see {@link DONE_WHEN_ALL_KEY})
 */
export const checkNodeDiscovered = (
  nodeId: string,
  lookup: DiscoveryLookup,
): boolean =>
  matchesDiscovered(nodeId, lookup) ||
  isDoneWhenAll(nodeId, doneWhenAllRules, lookup);

/**
 * Discovered check for a live (memory-read) actor. Its marker id is
 * position-based (`type@x:y`), but games whose actor type IS the spawn id
 * (Aniimo `e<staticId>`) report collected nodes as those bare spawn ids
 * (characterData.collectedNodeIds) — so match the raw actor type too, or a
 * collected chest whose entity is still loaded renders as unopened.
 */
export const checkLiveActorDiscovered = (
  liveNodeId: string,
  actorType: string,
  lookup: DiscoveryLookup,
): boolean =>
  checkNodeDiscovered(liveNodeId, lookup) ||
  lookup.discoveredSet.has(actorType);

/**
 * Discovery id for one spawn of a filter-type node — the SAME derivation the
 * FilterTooltip discovered-count uses, extracted so counts and bulk
 * discover/undiscover actions can never disagree.
 *
 * A private spawn, or a spawn whose id already contains `@` (an addressed id
 * such as `q_1101010@1101010s1g1`), keeps its id unchanged — the same rule as
 * {@link getNodeId}, so the marker and the filter counts address it by one id.
 * Every other spawn gets `<id or type>@<x>:<y>`.
 */
export const getSpawnDiscoveryId = (
  nodeType: string,
  spawn: {
    id?: string;
    isPrivate?: boolean;
    p: [number, number] | [number, number, number];
  },
): string =>
  spawn.id && (spawn.isPrivate || spawn.id.includes("@"))
    ? spawn.id
    : `${spawn.id ?? nodeType}@${spawn.p[0]}:${spawn.p[1]}`;

/**
 * Removal for "Undiscover all" (setDiscoveredNodesBulk), a single untick
 * (setDiscoverNode(id, false), toggleDiscoveredNode) and the respawn reset:
 * drops every stored mark that makes one of the target ids discovered (rules
 * 1-3 of {@link checkNodeDiscovered}: exact, old alias form, bare base id, and
 * the coordinate matches that join two ids of one node), plus marks
 * `<target>@…` of a bare target (a custom marker ticked on the map). A mark of
 * another current marker is never removed, however close. A done-when-all rule
 * describes a marker, not a stored mark, and does not widen the removal.
 * Returns the input array unchanged if nothing matches.
 *
 * `lookup`, when given, must be {@link buildDiscoveryLookup} of this same
 * `discoveredNodes` array (settings.ts passes its cached one, so a single
 * untick does not index every mark again).
 */
export const removeDiscoveredMatches = (
  discoveredNodes: string[],
  targetIds: string[],
  lookup?: DiscoveryLookup,
): string[] => {
  if (discoveredNodes.length === 0 || targetIds.length === 0)
    return discoveredNodes;
  lookup ??= buildDiscoveryLookup(discoveredNodes);
  const remove = new Set<string>();
  const collect: MarkVisitor = (mark) => {
    remove.add(mark);
    return false;
  };
  const bareTargets = new Set<string>();
  for (const target of targetIds) {
    if (!target.includes("@")) bareTargets.add(target);
    scanMatchingMarks(target, lookup, collect);
  }
  const kept = discoveredNodes.filter(
    (id) =>
      !remove.has(id) &&
      !(
        bareTargets.size > 0 &&
        id.includes("@") &&
        bareTargets.has(baseOf(id))
      ),
  );
  return kept.length === discoveredNodes.length ? discoveredNodes : kept;
};

/**
 * A lookup of one marks array plus a result cache of the discovered checks
 * against it (settings.isDiscoveredNode / isAutoDiscoveredNode and their
 * unticks). The index ({@link buildDiscoveryLookup}) holds only the marks, no
 * rules state: the known static ids, the custom marker ids and the
 * done-when-all rules are read per query. So it is rebuilt only when the marks
 * ARRAY changes; a rules version bump (every map switch and every My Filters
 * edit, see {@link getDoneWhenAllVersion}) only clears the results (Dune
 * Awakening: re-indexing 177k marks took ~0.5 s after each switch).
 * `build` is injectable for tests.
 */
export const createDiscoveryLookupCache = (
  build: (marks: string[]) => DiscoveryLookup = buildDiscoveryLookup,
) => {
  let marks: string[] | null = null;
  let lookup: DiscoveryLookup | null = null;
  let results = new Map<string, boolean>();
  let rulesVersion = -1;
  const get = (current: string[]): DiscoveryLookup => {
    if (!lookup || marks !== current) {
      marks = current;
      lookup = build(current);
      results = new Map();
      rulesVersion = discoveryRulesVersion;
    } else if (rulesVersion !== discoveryRulesVersion) {
      results = new Map();
      rulesVersion = discoveryRulesVersion;
    }
    return lookup;
  };
  return {
    /** The lookup of `current` (built once per array). */
    lookup: get,
    /** {@link checkNodeDiscovered} against `current`, cached per node id. */
    isDiscovered: (current: string[], nodeId: string): boolean => {
      const l = get(current);
      const cached = results.get(nodeId);
      if (cached !== undefined) return cached;
      const result = checkNodeDiscovered(nodeId, l);
      results.set(nodeId, result);
      return result;
    },
  };
};
