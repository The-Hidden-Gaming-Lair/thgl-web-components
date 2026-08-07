import type { MarkerOptions } from "./types";
import type { Region } from "./coordinates";
import type { Drawing, PrivateNode } from "./settings";
import { Game, games, getAppDomain } from "./games";

export type IconName =
  | "House"
  | "Map"
  | "Server"
  | "BookOpen"
  | "ScrollText"
  | "ArrowUp"
  | "Bug"
  | "NotepadText"
  | "Axe"
  | "Gift"
  | "MapPin"
  | "Trophy"
  | "SquareCheckBig"
  | "MessageSquareWarning"
  | "Grid"
  | "Megaphone"
  | "MonitorSmartphone"
  | "Heart"
  | "Handshake"
  | "Newspaper"
  | "MessageSquare"
  | "HelpCircle"
  | "FileText"
  | "ShieldCheck"
  | "Fish"
  | "Bird"
  | "ChefHat"
  | "Flower"
  | "PawPrint"
  | "Users"
  | "CloudSun";

export type AppConfig = {
  name: string;
  domain: string;
  title: string;
  supportedLocales: string[];
  keywords: string[];
  appUrl: string | null;
  withoutLiveMode?: boolean;
  /**
   * Gate the whole tenant behind an "In Development" placeholder in production.
   * The real site still renders on the local dev server (NODE_ENV !== "production")
   * so the game can be worked on before it's ready to ship publicly.
   */
  inDevelopment?: boolean;
  internalLinks?: {
    title: string;
    description?: string;
    href: string;
    linkText?: string;
    bgImage?: string;
    iconName: IconName;
  }[];
  promoLinks?: {
    title: string;
    href: string;
  }[];
  externalLinks?: { href: string; title: string }[];
  markerOptions?: MarkerOptions;
  game?: Game;
  /** Featured filter IDs to highlight on the home page. If not set, first filters are shown. */
  topFilters?: string[];
  /**
   * Database-mode settings. When set, the app renders as a DB site
   * (custom landing page with entity counts, header search instead of
   * settings) rather than a map site. Used by homm-olden-era and
   * other future game-database deployments.
   */
  db?: DbAppConfig;
};

export type DbAppConfig = {
  /** Tagline rendered under the H1 (e.g. "Game Database"). */
  heroSubtitle: string;
  /** Placeholder text for the hero search button. */
  searchPlaceholder: string;
  /** Sections rendered as cards on the landing page. */
  homeSections: Array<{
    href: string;
    /** Dict key for the section title (resolved at render time). */
    titleKey?: string;
    /** Fallback label if the dict key doesn't resolve. */
    titleFallback?: string;
    /** Database entry type used to compute the count badge. */
    type: string;
    /** Extra entry types whose item counts should be added to this section. */
    extraTypes?: string[];
    /**
     * Match every database category whose `type` starts with this prefix.
     * Used by games that ship one category per sub-group (e.g. BPSR's
     * `dictionary_historical_events`, `dictionary_concepts`, ...) instead
     * of a single category per section. When set, the section's URL
     * receives every matching entry; `type`/`extraTypes` are still honoured
     * for exact matches alongside.
     */
    typePrefix?: string;
    /** Glyph rendered to the left of the card title. */
    icon: string;
    /** Optional description. If absent, falls back to the matching internalLink description. */
    description?: string;
  }>;
  /** Full-width links rendered below the section grid (e.g. Game Mechanics). */
  homeExtraLinks?: Array<{
    href: string;
    title: string;
    description: string;
    icon: string;
  }>;
  /** Per-entry-type display labels shown in the header search dropdown. */
  typeLabels?: Record<string, string>;
  /** Per-entry-type Tailwind classes (bg + text colour) for the search dropdown badges. */
  typeColors?: Record<string, string>;
  /**
   * When true, every `homeSections` entry also becomes a header-nav item
   * (de-duplicated against `internalLinks` by href, overflowing into the
   * "More" menu). Lets the nav stay data-driven from the section list instead
   * of hand-curating each section in `internalLinks`. Off by default so other
   * tenants keep their curated navs.
   */
  sectionsInNav?: boolean;
  /**
   * Number of UI translations to display on the landing page. Defaults to
   * `appConfig.supportedLocales.length` when omitted.
   */
  languageCount?: number;
};

export type OverwolfAppConfig = {
  name: string;
  domain: string;
  title: string;
  gameClassId: number;
  appUrl: string;
  withoutLiveMode?: boolean;
  appId: string;
  discordApplicationId: string;
  markerOptions: MarkerOptions;
};

export type THGLAppConfig = {
  name: string;
  domain: string;
  title: string;
  withoutOverlayMode?: boolean;
  markerOptions: MarkerOptions;
  defaultHotkeys: Record<string, string>;
};

/**
 * Single source of truth for game config (see CLAUDE.md "Single source of
 * truth for game config").
 *
 * `games` (the `Game[]` registry in games.ts) is canonical. The per-surface
 * configs — web `AppConfig` (configs/*.ts) and `OverwolfAppConfig`
 * (*-overwolf/src/config.ts) — only carry surface-specific fields plus a
 * `name` that links back to `Game.id`. Shared fields (`title`, `domain`,
 * `markerOptions`) are NOT re-declared there; they are derived from the linked
 * `Game` by the resolvers below. The strict output types (`AppConfig`,
 * `OverwolfAppConfig`) keep those fields required so component consumers are
 * unchanged; the `*Input` types make the derivable fields optional so a config
 * file can omit them (or override when no `Game` exists, e.g. thgl-web).
 */

/** A game's marker render options, regardless of where they live on `Game`. */
export function getGameMarkerOptions(game: Game): MarkerOptions | undefined {
  return game.markerOptions ?? game.companion?.markerOptions;
}

/** Web config as authored: `title`/`domain` optional (derived from `Game`). */
export type AppConfigInput = Omit<AppConfig, "title" | "domain"> &
  Partial<Pick<AppConfig, "title" | "domain">>;

/** Overwolf config as authored: derivable fields optional. */
export type OverwolfAppConfigInput = Omit<
  OverwolfAppConfig,
  "title" | "domain" | "markerOptions"
> &
  Partial<Pick<OverwolfAppConfig, "title" | "domain" | "markerOptions">>;

/**
 * Fill a web `AppConfig`'s shared fields from its linked `Game`. Authored
 * values win (override); when absent they fall back to the registry. Configs
 * with no matching `Game` (thgl-web, thgl-app, drakantos) must supply their
 * own `title`/`domain`.
 */
export function resolveAppConfig(cfg: AppConfigInput): AppConfig {
  const game = games.find((g) => g.id === cfg.name);
  return {
    ...cfg,
    title: cfg.title ?? game?.title ?? cfg.name,
    domain: cfg.domain ?? (game ? getAppDomain(game) : cfg.name),
    markerOptions: cfg.markerOptions ?? (game && getGameMarkerOptions(game)),
    // Embed the linked Game so consumers can read game-level data (e.g.
    // additionalTooltip in guide-page) without a second registry lookup.
    game: cfg.game ?? game,
  };
}

/**
 * Fill an `OverwolfAppConfig`'s shared fields from its linked `Game`. The
 * store identifiers (`appId`/`appUrl`) stay in the overwolf config and are
 * never hoisted to the public registry.
 */
export function resolveOverwolfConfig(
  cfg: OverwolfAppConfigInput,
): OverwolfAppConfig {
  const game = games.find((g) => g.id === cfg.name);
  const markerOptions =
    cfg.markerOptions ?? (game && getGameMarkerOptions(game));
  if (!markerOptions) {
    throw new Error(
      `resolveOverwolfConfig: no markerOptions for "${cfg.name}" (set them on the Game or in the overwolf config)`,
    );
  }
  return {
    ...cfg,
    title: cfg.title ?? game?.title ?? cfg.name,
    domain: cfg.domain ?? (game ? getAppDomain(game) : cfg.name),
    markerOptions,
  };
}

export type Version = {
  id: string;
  createdAt: number;
  data: {
    filters: FiltersConfig;
    regions: Region[];
    tiles: TilesConfig;
    globalFilters: GlobalFiltersConfig;
    typesIdMap: Record<string, string>;
    drawings: DrawingsConfig;
  };
  more: {
    nodes: Record<string, string>;
    icons: string;
  };
  /** Spawn counts for UI display */
  counts?: {
    /** Total spawns across all maps */
    total: number;
    /** Spawn count per filter type ID */
    byType: Record<string, number>;
    /** Spawn count per map name */
    byMap: Record<string, number>;
  };
};

/**
 * All env reads in this file must stay literal `process.env.NEXT_PUBLIC_*`
 * member expressions so Next.js can inline them into client bundles. Vite
 * apps (Overwolf) don't shim `process` in the browser — every
 * vite.config.ts must register thglEnvDefine() from @repo/lib/vite-define
 * or this module throws "process is not defined" at startup.
 */
// TH_GL_URL is defined in the leaf env.ts (so games.ts can use it for logo URLs
// without a config<->games circular import); re-exported here for back-compat.
export { TH_GL_URL } from "./env";
export const API_FORGE_URL =
  process.env.NEXT_PUBLIC_API_FORGE_URL ?? "https://api-forge.th.gl";

/**
 * Dev-only forge proxy (games-web). When NEXT_PUBLIC_FORGE_DEV_PROXY is on
 * (set by apps/games-web/next.config.js in `next dev`), DATA_FORGE_URL and
 * DATA_FORGE_CDN_URL become same-origin paths. games-web's proxy.ts
 * forwards them per request: tenants whose first host label ends in "-dev"
 * (e.g. palia-dev.localhost:3100) hit the local data-forge dev server,
 * every other host the prod endpoints. Because the rendered markup only
 * ever contains the host-independent relative URL, SSR and client output
 * match on both hosts (no hydration mismatch) and forge requests are
 * same-origin (no CORS).
 *
 * Server-side fetch() can't take relative URLs — resolveForgeUrl() maps
 * them back to the absolute target using the per-request Host.
 */
export const FORGE_DEV_PROXY = process.env.NEXT_PUBLIC_FORGE_DEV_PROXY === "1";
export const FORGE_API_PROXY_PATH = "/__forge-api";
export const FORGE_CDN_PROXY_PATH = "/__forge-cdn";
/** The local data-forge dev server serves both API and CDN content. */
export const FORGE_LOCAL_TARGET = "http://localhost:33033";

const DATA_FORGE_PROD_URL =
  process.env.NEXT_PUBLIC_DATA_FORGE_URL ?? "https://api.th.gl";
const DATA_FORGE_CDN_PROD_URL =
  process.env.NEXT_PUBLIC_DATA_FORGE_CDN_URL ?? "https://cdn.th.gl";

// API endpoints (search)
export const DATA_FORGE_URL = FORGE_DEV_PROXY
  ? FORGE_API_PROXY_PATH
  : DATA_FORGE_PROD_URL;

// Static files (version.json, icons, tiles, config, dicts)
export const DATA_FORGE_CDN_URL = FORGE_DEV_PROXY
  ? FORGE_CDN_PROXY_PATH
  : DATA_FORGE_CDN_PROD_URL;

/**
 * True when the request host opts into the local data-forge: the first
 * label of a *.localhost host ends in "-dev" (palia-dev.localhost:3100).
 */
export function isDevForgeHost(host: string): boolean {
  const hostname = host.split(":")[0].replace(/\.$/, "");
  return (
    hostname.endsWith(".localhost") && hostname.split(".")[0].endsWith("-dev")
  );
}

/**
 * Resolve the origin a forge proxy path should be forwarded to for the
 * given request host, or null if the path is not a forge proxy path.
 * Used by games-web's proxy.ts.
 */
export function getForgeProxyTarget(
  host: string,
  pathname: string,
): string | null {
  const local = isDevForgeHost(host);
  if (pathname.startsWith(`${FORGE_CDN_PROXY_PATH}/`)) {
    return local ? FORGE_LOCAL_TARGET : DATA_FORGE_CDN_PROD_URL;
  }
  if (pathname.startsWith(`${FORGE_API_PROXY_PATH}/`)) {
    return local ? FORGE_LOCAL_TARGET : DATA_FORGE_PROD_URL;
  }
  return null;
}

type RequestHostResolver = () => Promise<string | null>;
/**
 * Stored on globalThis (not module state) because games-web registers the
 * resolver from instrumentation.ts, which may not share module instances
 * with the RSC server graph.
 */
const REQUEST_HOST_RESOLVER_KEY = "__thglRequestHostResolver";

/**
 * Registered once at server start by games-web (instrumentation.ts) with a
 * next/headers-based callback, so this package can read the per-request
 * Host without importing next/headers (which Vite apps can't resolve).
 */
export function setRequestHostResolver(resolver: RequestHostResolver): void {
  (globalThis as Record<string, unknown>)[REQUEST_HOST_RESOLVER_KEY] = resolver;
}

/**
 * Map a proxy-relative forge URL (see FORGE_DEV_PROXY) back to its real
 * absolute target. No-op for absolute URLs and in the browser — there the
 * relative URL is correct, the request carries the Host that proxy.ts
 * switches on. On the server it resolves directly against the current
 * request's host, skipping the proxy hop.
 */
export async function resolveForgeUrl(url: string): Promise<string> {
  if (typeof window !== "undefined" || !url.startsWith("/")) return url;
  const prefix = url.startsWith(`${FORGE_CDN_PROXY_PATH}/`)
    ? FORGE_CDN_PROXY_PATH
    : url.startsWith(`${FORGE_API_PROXY_PATH}/`)
      ? FORGE_API_PROXY_PATH
      : null;
  if (!prefix) return url;
  const resolver = (globalThis as Record<string, unknown>)[
    REQUEST_HOST_RESOLVER_KEY
  ] as RequestHostResolver | undefined;
  // No resolver or no request scope (e.g. build-time render) → prod.
  const host = (await resolver?.().catch(() => null)) ?? "";
  const target = getForgeProxyTarget(host, url);
  return target ? target + url.slice(prefix.length) : url;
}

export function getImageURL(url: string) {
  if (url.startsWith("/global_icons/game-icons")) {
    return `${DATA_FORGE_CDN_URL}${url.replace("/global_icons", "")}`;
  }
  return url;
}

export function getAppUrl(appName: string, path: string): string {
  return `${DATA_FORGE_CDN_URL}/${appName}${path}`;
}

/**
 * Cache-bust lever for map tiles. Tile URLs are content-hashed and served with
 * `Cache-Control: immutable`, so a poisoned browser entry (e.g. a 404 cached
 * during a tile outage) never revalidates and sticks for up to a year. Bumping
 * this appends a new `?v=` to every tile request, so clients fetch a fresh URL
 * and bypass the stale entry WITHOUT re-tiling — the CDN serves the same files
 * under the new query. Only the visible tiles re-download per session.
 *
 * Bumping busts tiles for ALL games/users once. Set to 0 to disable the param.
 * (2026-06-22: introduced at v=1 to recover clients poisoned by the Crimson
 * Desert tile outage.)
 */
export const TILE_CACHE_VERSION = 1;

/** Full CDN tile-layer URL with the cache-bust version appended. */
export function getTileLayerUrl(appName: string, tilePath: string): string {
  const url = getAppUrl(appName, tilePath);
  if (!TILE_CACHE_VERSION) return url;
  return `${url}${url.includes("?") ? "&" : "?"}v=${TILE_CACHE_VERSION}`;
}

export function getApiUrl(appName: string, searchParams: string): string {
  return `${DATA_FORGE_URL}/api/${appName}/search?${searchParams}`;
}

export function getPreviewImageUrl(
  appName: string,
  mapName: string,
  version?: string,
): string {
  const url = `${DATA_FORGE_CDN_URL}/${appName}/map-tiles/${mapName}/preview.webp`;
  return version ? `${url}?v=${version}` : url;
}

export function getOpenGraphImageUrl(appName: string, mapName: string): string {
  return `${DATA_FORGE_CDN_URL}/${appName}/map-tiles/${mapName}/opengraph-image.jpg`;
}

/**
 * Fetch JSON and cache it in a module-level Map keyed by URL. Bypasses
 * Next.js's data cache (which has a hard 2 MB ceiling on the parsed JS
 * representation) and runs our own per-process LRU with a TTL.
 *
 * Use for endpoints whose parsed response can exceed 2 MB (version.json on
 * games with lots of regions, dicts/<locale>-desc.json on text-heavy games)
 * or whose payload doesn't fit Next.js's tag/path invalidation model.
 *
 * Dedupes concurrent requests for the same URL so cold renders don't
 * double-fetch.
 */
const memoryFetchCache = new Map<
  string,
  { data: unknown; expiresAt: number }
>();
const memoryFetchInflight = new Map<string, Promise<unknown>>();
const MEMORY_FETCH_TTL_MS = 60_000;

export async function fetchJsonWithMemoryCache<T>(
  url: string,
  options?: { onNotFound?: () => T | undefined; ttlMs?: number },
): Promise<T> {
  // Resolve before the cache lookup so the cache is keyed by the real
  // target (local vs prod forge differ per request in dev proxy mode).
  url = await resolveForgeUrl(url);
  const now = Date.now();
  const cached = memoryFetchCache.get(url);
  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }
  const inflight = memoryFetchInflight.get(url);
  if (inflight) return inflight as Promise<T>;

  const ttl = options?.ttlMs ?? MEMORY_FETCH_TTL_MS;
  const promise = (async () => {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      if (res.status === 404 && options?.onNotFound) {
        const fallback = options.onNotFound();
        if (fallback !== undefined) {
          // Cache the fallback like a normal result — otherwise every call
          // for a missing resource re-fetches the 404 from the CDN.
          memoryFetchCache.set(url, {
            data: fallback,
            expiresAt: Date.now() + ttl,
          });
          return fallback;
        }
      }
      throw new Error(`Failed to fetch ${url}: ${res.status}`);
    }
    const data = (await res.json()) as T;
    memoryFetchCache.set(url, { data, expiresAt: Date.now() + ttl });
    return data;
  })().finally(() => {
    memoryFetchInflight.delete(url);
  });
  memoryFetchInflight.set(url, promise);
  return promise;
}

export async function fetchVersion(appName: string): Promise<Version> {
  return fetchJsonWithMemoryCache<Version>(
    getAppUrl(appName, "/version.json"),
    {
      ttlMs: process.env.NODE_ENV === "development" ? 0 : MEMORY_FETCH_TTL_MS,
    },
  );
}

// Cache for version lookup maps to avoid recreating them on each call
const versionCacheMap = new WeakMap<
  Version,
  {
    tileKeys: Set<string>;
    filterValueIds: Set<string>;
    filterGroupIds: Set<string>;
  }
>();

// Separate cache for dict reverse lookup (keyed by dict object reference)
const dictCacheMap = new WeakMap<
  Record<string, string>,
  Map<string, string[]>
>();

function getVersionLookupCache(version: Version) {
  let cache = versionCacheMap.get(version);

  if (!cache) {
    // Build set of valid tile keys
    const tileKeys = new Set(Object.keys(version.data.tiles));

    // Build set of valid filter value IDs
    const filterValueIds = new Set<string>();
    const filterGroupIds = new Set<string>();
    for (const filter of version.data.filters) {
      filterGroupIds.add(filter.group);
      for (const value of filter.values) {
        filterValueIds.add(value.id);
      }
    }

    cache = { tileKeys, filterValueIds, filterGroupIds };
    versionCacheMap.set(version, cache);
  }

  return cache;
}

function getReverseDictMap(
  dict: Record<string, string>,
): Map<string, string[]> {
  let reverseDictMap = dictCacheMap.get(dict);

  if (!reverseDictMap) {
    // Build reverse dictionary map (value -> keys[])
    // Resolve pointer values (e.g. "@other_key" -> dict["@other_key"])
    reverseDictMap = new Map<string, string[]>();
    for (const [key, value] of Object.entries(dict)) {
      const resolved =
        value && value[0] === "@" ? (dict[value] ?? value) : value;
      const existing = reverseDictMap.get(resolved) || [];
      existing.push(key);
      reverseDictMap.set(resolved, existing);
    }
    dictCacheMap.set(dict, reverseDictMap);
  }

  return reverseDictMap;
}

export function getMapNameFromVersion(
  version: Version,
  map: string,
  dict: Record<string, string>,
): string | null {
  const decodedMap = decodeURIComponent(map);
  const { tileKeys } = getVersionLookupCache(version);
  const reverseDictMap = getReverseDictMap(dict);

  const possibleKeys = reverseDictMap.get(decodedMap);
  if (!possibleKeys) return null;
  // Find first key that exists in tiles
  for (const key of possibleKeys) {
    if (key[0] === "@") {
      const resolvedKeys = reverseDictMap.get(key);
      if (!resolvedKeys) continue;

      for (const resolvedKey of resolvedKeys) {
        if (tileKeys.has(resolvedKey)) {
          return resolvedKey;
        }
      }
    } else if (tileKeys.has(key)) {
      return key;
    }
  }

  return null;
}

export function getTypeFromVersion(
  version: Version,
  type: string,
  dict: Record<string, string>,
): string | null {
  const decodedType = decodeURIComponent(type);
  const { filterValueIds } = getVersionLookupCache(version);
  const reverseDictMap = getReverseDictMap(dict);

  const possibleKeys = reverseDictMap.get(decodedType);
  if (!possibleKeys) return null;

  // Find first key that exists in filter values
  for (const key of possibleKeys) {
    if (filterValueIds.has(key)) {
      return key;
    }
  }

  return null;
}

/** Return ALL filter value IDs that translate to the same English name */
export function getAllTypesFromVersion(
  version: Version,
  type: string,
  dict: Record<string, string>,
): string[] {
  const decodedType = decodeURIComponent(type);
  const { filterValueIds } = getVersionLookupCache(version);
  const reverseDictMap = getReverseDictMap(dict);

  const possibleKeys = reverseDictMap.get(decodedType);
  if (!possibleKeys) return [];

  return possibleKeys.filter((key) => filterValueIds.has(key));
}

export function getGroupFromVersion(
  version: Version,
  group: string,
  dict: Record<string, string>,
): string | null {
  const decodedGroup = decodeURIComponent(group);
  const { filterGroupIds } = getVersionLookupCache(version);
  const reverseDictMap = getReverseDictMap(dict);

  const possibleKeys = reverseDictMap.get(decodedGroup);
  if (!possibleKeys) return null;

  // Find first key that exists in filter groups
  for (const key of possibleKeys) {
    if (filterGroupIds.has(key)) {
      return key;
    }
  }

  return null;
}

export function getIconsUrl(
  appName: string,
  icon: string,
  iconPath?: string,
): string {
  if (icon.startsWith("/global_icons/game-icons")) {
    return `${DATA_FORGE_CDN_URL}${icon.replace("/global_icons", "")}`;
  }
  if (icon.includes("global_icons")) {
    return icon;
  }
  if ((icon === "icons.webp" || icon === "/icons/icons.webp") && iconPath) {
    return getAppUrl(appName, iconPath);
  }
  if (icon.startsWith("/")) {
    return getAppUrl(appName, icon);
  }
  return getAppUrl(appName, `/icons/${icon}`);
}

/**
 * Fetch a game's localisation dictionary. Routed through the module-level
 * memory cache (see `fetchJsonWithMemoryCache`) to sidestep Next.js's 2 MB
 * data-cache ceiling - some games' combined dicts (Avowed, Infinity Nikki,
 * Crimson Desert) parse to > 2 MB in V8 even though the source JSON is smaller.
 */
export async function fetchDict(
  appName: string,
  locale: string = "en",
): Promise<Record<string, string>> {
  const dict = await fetchJsonWithMemoryCache<Record<string, string> | null>(
    `${DATA_FORGE_CDN_URL}/${appName}/dicts/${locale}.json`,
    { onNotFound: () => null },
  );
  if (dict !== null) return dict;
  // A locale without a dict on the CDN (tenant advertises more locales than the
  // data pipeline emits, or a crawler-cased URL like /zh-cn/) must not 500 the
  // render — fall back to English, matching getAppDictionary's behavior.
  if (locale === "en") {
    throw new Error(`Missing en dict for ${appName}`);
  }
  return fetchDict(appName, "en");
}

export async function fetchDatabase(appName: string): Promise<DatabaseConfig> {
  const res = await fetch(
    await resolveForgeUrl(
      `${DATA_FORGE_CDN_URL}/${appName}/config/database.json`,
    ),
    { next: { revalidate: 60 } },
  );
  return res.json();
}

/**
 * Fetch the slim per-type index when the app's database is split into multiple
 * files (e.g. when it would otherwise exceed Next.js's 2 MB fetch cache limit).
 * Each item carries `id`, `icon`, `groupId` and any small lite props the data
 * pipeline opted in to. Use this for sidebars, search indices and cross-link
 * lookups across all types.
 */
export async function fetchDatabaseIndex(
  appName: string,
): Promise<DatabaseConfig> {
  const res = await fetch(
    await resolveForgeUrl(
      `${DATA_FORGE_CDN_URL}/${appName}/config/database.index.json`,
    ),
    { next: { revalidate: 60 } },
  );
  // Games that ship a single monolith database.json (no split index, e.g. BPSR)
  // fall back to it so the home/db section counts and listings still work.
  if (!res.ok) return fetchDatabase(appName);
  return res.json();
}

/**
 * Fetch a single type's full database entry (one `{type, items}` category with
 * full `props` per item). Pair with `fetchDatabaseIndex` for cross-link data.
 */
export async function fetchDatabaseType(
  appName: string,
  type: string,
): Promise<DatabaseConfig[number]> {
  const res = await fetch(
    await resolveForgeUrl(
      `${DATA_FORGE_CDN_URL}/${appName}/config/database.${type}.json`,
    ),
    { next: { revalidate: 60 } },
  );
  return res.json();
}

export async function fetchTiles(appName: string): Promise<TilesConfig> {
  const res = await fetch(
    await resolveForgeUrl(`${DATA_FORGE_CDN_URL}/${appName}/config/tiles.json`),
    { next: { revalidate: 60 } },
  );
  return res.json();
}

export type GlobalFiltersConfig = Array<{
  group: string;
  values: Array<{
    id: string;
    defaultOn?: boolean;
  }>;
}>;

export type DrawingsConfig = {
  name: string;
  isShared?: boolean;
  url?: string;
  nodes?: PrivateNode[];
  drawing?: Drawing;
}[];

export type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Icon = string | IconSprite;
export type DatabaseConfig<T = Record<string, any>> = {
  type: string;
  items: {
    id: string;
    icon?: Icon;
    props: T;
    groupId?: string;
  }[];
}[];

export type FiltersConfig = {
  group: string;
  category?: string;
  defaultOpen?: boolean;
  defaultOn?: boolean;
  values: {
    id: string;
    icon:
      | string
      | {
          name: string;
          url: string;
          x: number;
          y: number;
          width: number;
          height: number;
        };
    size?: number;
    sort?: number;
    /** No plotted map markers for this type (only shown via the in-app live overlay). */
    no_map_markers?: boolean;
    /** @deprecated Renamed to `no_map_markers`. Still read for back-compat. */
    live_only?: boolean;
    autoDiscover?: boolean;
    defaultOn?: boolean;
    // Stable identifier shared by all variants of the same underlying entity
    // (base / starred / infected / amber / masked / royal / magical / sized
    // siblings). Used by FilterSettingsPopover to offer a "Enable all
    // variants" toggle. Omitted for filters with no siblings.
    baseType?: string;
  }[];
}[];

export type RegionsConfig = Region[];

export type TileLayer = {
  url?: string;
  defaultTitle?: string;
  options?: {
    minNativeZoom: number;
    maxNativeZoom: number;
    bounds: [[number, number], [number, number]];
    tileSize: number;
    threshold?: number;
  };
  minZoom?: number;
  maxZoom?: number;
  fitBounds?: [[number, number], [number, number]];
  view?: { center?: [number, number]; zoom?: number };
  transformation?: [number, number, number, number];
  threshold?: number;
  rotation?: {
    center: [number, number];
    angle: number;
  };
  /**
   * Marks this map as a FLOOR of a layered/hierarchical area (multi-floor
   * towers, underground, interiors). Floors of the same `group` are shown
   * together in the LayerSelect control and switched between like any map.
   * A layer map typically REUSES its parent's `url`/`options` (so the parent
   * tiles render as spatial context) and draws its own `overlay` on top.
   */
  layer?: {
    /** The map this is a floor of (whose tiles provide the backdrop). */
    parent: string;
    /** Area id grouping all floors together (e.g. the interior's name). */
    group: string;
    /** Sort order within the group; lower = higher floor (0 = surface). */
    floor: number;
    /** Display label for this floor (falls back to `defaultTitle`). */
    label?: string;
    /**
     * Tight XY world footprint of the interior (shared by all floors of the
     * group). In live mode the apps auto-switch to this interior when the
     * player's position falls inside it. [[minLat,minLng],[maxLat,maxLng]].
     */
    footprint?: [[number, number], [number, number]];
    /**
     * This floor's height (Z) band [min,max] — used in live mode to pick which
     * floor of a multi-floor interior the player is on.
     */
    zRange?: [number, number];
  };
  /**
   * An interior image drawn over the tiles (the floor plan of a layered area),
   * positioned at `bounds` in map coordinates. Rendered via ImageOverlayLayer.
   */
  overlay?: {
    url: string;
    bounds: [[number, number], [number, number]];
    opacity?: number;
  };
  /**
   * Multiple interior overlays drawn at once — the single "Underground" map
   * renders every interior's floor plan, and the overworld draws them faint as
   * context. Each is placed at its own `bounds`.
   */
  overlays?: {
    url: string;
    bounds: [[number, number], [number, number]];
    /** Interior name — shown as an on-map "Underground" entrance button. */
    label?: string;
  }[];
  /**
   * Per-interior footprints (tight XY world bounds). Live mode auto-switches to
   * the Underground when the player falls inside ANY of these.
   */
  footprints?: [[number, number], [number, number]][];
  /** Dim the underlying tiles so the `overlay`(s) read as the active floor. */
  backdrop?: boolean;
};
export type TilesConfig = Record<string, TileLayer>;

/**
 * Whether two maps share the same world — the same map, a layer of the other
 * (e.g. an "Underground" whose `layer.parent` is the surface), or two layers of
 * the same parent. Layer maps reuse the parent's world transform, so a position
 * on one projects to the same spot on the other. `!!aParent` guards the sibling
 * check so two ordinary maps (both `parent === undefined`) are NOT treated as the
 * same world in games without layered maps.
 */
export function isSameWorld(
  a: string,
  b: string | undefined,
  tiles: TilesConfig,
): boolean {
  if (a === b) return true;
  if (!b) return false;
  const aParent = tiles[a]?.layer?.parent;
  const bParent = tiles[b]?.layer?.parent;
  return aParent === b || bParent === a || (!!aParent && aParent === bParent);
}
