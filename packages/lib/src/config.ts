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
  | "CloudSun"
  | "Shield"
  | "Sparkles";

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
    /** Elite-only (preview) link — hidden from nav/home/sitemap for everyone
     *  else. Used to soft-launch a WIP page of a live game. */
    previewOnly?: boolean;
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
   * Hide the standalone interactive-map nav link + home map cards even when the
   * game HAS tiles. For games where the map is better browsed as a DB "Maps"
   * section (e.g. Soul's Remnant's tiny side-scroller levels) rather than the
   * leaflet interactive map. The /maps routes still resolve; they're just not
   * surfaced in the chrome.
   */
  hideInteractiveMap?: boolean;
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
    /** Changes whenever the dicts or database output change (see withContentHash). */
    contentHash?: string;
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
 * Stale-while-revalidate: once a URL is cached, callers never wait on the
 * network for it again. An expired entry is returned immediately and refreshed
 * in the background; a failed refresh keeps serving the old copy. Before this,
 * every expiry made an SSR render await cdn.th.gl, and a hung connect (undici
 * ETIMEDOUT after 10 s) held the render and 5xx'd the page. During the
 * 2026-09-25 Googlebot crawl that spilled into 499s on every tenant.
 *
 * `immutable` entries (URL pinned to a content hash, see withContentHash) are
 * never refreshed. Total cached bytes are capped; least recently used entries
 * are evicted first. Dedupes concurrent requests for the same URL so cold
 * renders don't double-fetch.
 */
type MemoryFetchEntry = { data: unknown; expiresAt: number; bytes: number };
const memoryFetchCache = new Map<string, MemoryFetchEntry>();
const memoryFetchInflight = new Map<string, Promise<unknown>>();
const MEMORY_FETCH_TTL_MS = 60_000;
const MEMORY_FETCH_MAX_BYTES = 256 * 1024 * 1024;
let memoryFetchBytes = 0;

type MemoryFetchOptions<T> = {
  onNotFound?: () => T | undefined;
  ttlMs?: number;
  immutable?: boolean;
};

function storeMemoryFetchEntry(url: string, entry: MemoryFetchEntry) {
  const previous = memoryFetchCache.get(url);
  if (previous) {
    memoryFetchBytes -= previous.bytes;
    memoryFetchCache.delete(url);
  }
  memoryFetchCache.set(url, entry);
  memoryFetchBytes += entry.bytes;
  // Map iteration is insertion order and hits re-insert, so this walks LRU-first.
  for (const [key, oldest] of memoryFetchCache) {
    if (memoryFetchBytes <= MEMORY_FETCH_MAX_BYTES || key === url) break;
    memoryFetchCache.delete(key);
    memoryFetchBytes -= oldest.bytes;
  }
}

/** One retry for network failures (DNS, connect timeout), not HTTP errors. */
async function fetchNoStore(url: string): Promise<Response> {
  try {
    return await fetch(url, { cache: "no-store" });
  } catch {
    return fetch(url, { cache: "no-store" });
  }
}

function loadIntoMemoryCache<T>(
  url: string,
  options?: MemoryFetchOptions<T>,
): Promise<T> {
  const inflight = memoryFetchInflight.get(url);
  if (inflight) return inflight as Promise<T>;

  const ttl = options?.ttlMs ?? MEMORY_FETCH_TTL_MS;
  const expiresAt = () =>
    options?.immutable ? Number.POSITIVE_INFINITY : Date.now() + ttl;
  const promise = (async () => {
    const res = await fetchNoStore(url);
    if (!res.ok) {
      if (res.status === 404 && options?.onNotFound) {
        const fallback = options.onNotFound();
        if (fallback !== undefined) {
          // Cache the fallback like a normal result — otherwise every call
          // for a missing resource re-fetches the 404 from the CDN.
          storeMemoryFetchEntry(url, {
            data: fallback,
            expiresAt: expiresAt(),
            bytes: 0,
          });
          return fallback;
        }
      }
      throw new Error(`Failed to fetch ${url}: ${res.status}`);
    }
    const text = await res.text();
    const data = JSON.parse(text) as T;
    storeMemoryFetchEntry(url, {
      data,
      expiresAt: expiresAt(),
      bytes: text.length,
    });
    return data;
  })().finally(() => {
    memoryFetchInflight.delete(url);
  });
  memoryFetchInflight.set(url, promise);
  return promise;
}

export async function fetchJsonWithMemoryCache<T>(
  url: string,
  options?: MemoryFetchOptions<T>,
): Promise<T> {
  // Resolve before the cache lookup so the cache is keyed by the real
  // target (local vs prod forge differ per request in dev proxy mode).
  url = await resolveForgeUrl(url);
  const ttl = options?.ttlMs ?? MEMORY_FETCH_TTL_MS;
  const cached = memoryFetchCache.get(url);
  // ttl 0 (dev version.json) opts out of serving stale.
  if (cached && (ttl > 0 || cached.expiresAt > Date.now())) {
    memoryFetchCache.delete(url);
    memoryFetchCache.set(url, cached);
    if (cached.expiresAt <= Date.now() && !memoryFetchInflight.has(url)) {
      loadIntoMemoryCache(url, options).catch((error) => {
        // Keep serving the stale copy; retry after another TTL.
        cached.expiresAt = Date.now() + ttl;
        console.warn(`Background refresh failed, serving stale ${url}:`, error);
      });
    }
    return cached.data as T;
  }
  return loadIntoMemoryCache(url, options);
}

export async function fetchVersion(appName: string): Promise<Version> {
  return fetchJsonWithMemoryCache<Version>(
    getAppUrl(appName, "/version.json"),
    {
      ttlMs: process.env.NODE_ENV === "development" ? 0 : MEMORY_FETCH_TTL_MS,
    },
  );
}

/**
 * Pin a data-forge file URL to the game's content hash (version.json
 * `more.contentHash`, which data-forge changes whenever the dicts or database
 * output change). Hashed URLs are cached until the next data update instead of
 * being re-fetched every minute; the `?v=` also keys the CDN edge cache.
 * version.json files that predate the field keep the TTL behaviour.
 */
async function withContentHash(
  appName: string,
  url: string,
): Promise<{ url: string; immutable: boolean }> {
  const hash = await fetchVersion(appName)
    .then((version) => version.more.contentHash)
    .catch(() => undefined);
  if (!hash) return { url, immutable: false };
  return {
    url: `${url}${url.includes("?") ? "&" : "?"}v=${hash}`,
    immutable: true,
  };
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

/**
 * Resolve a map URL segment to BOTH its tile key and its canonical display
 * name, tolerating '+'-as-space and wrong CASE. Used to 301/308-canonicalize
 * non-canonical map URLs (e.g. `/maps/palpagos%20island` or a legacy
 * `+`-encoded form) to the proper-cased `%20` URL that the sitemap emits.
 *
 * `name` is the canonical display name for the resolved tile in THIS dict
 * (locale) — encode it with encodeURIComponent to build the canonical path.
 * Returns null when the segment doesn't resolve to a real map (→ caller 404s).
 */
export function getCanonicalMapName(
  version: Version,
  map: string,
  dict: Record<string, string>,
): { key: string; name: string } | null {
  // Mirror getMapNameFromVersion's decode, but also treat '+' as a space so a
  // legacy `/maps/Foo+Bar` still resolves (proxy normally 301s it first).
  const decodedMap = decodeURIComponent(map.replace(/\+/g, " "));
  const { tileKeys } = getVersionLookupCache(version);
  const reverseDictMap = getReverseDictMap(dict);

  // Given a display name, resolve to the first tile key it maps to (handles
  // pointer values, identical to getMapNameFromVersion).
  const resolveTileKey = (displayName: string): string | null => {
    const possibleKeys = reverseDictMap.get(displayName);
    if (!possibleKeys) return null;
    for (const key of possibleKeys) {
      if (key[0] === "@") {
        const resolvedKeys = reverseDictMap.get(key);
        if (!resolvedKeys) continue;
        for (const resolvedKey of resolvedKeys) {
          if (tileKeys.has(resolvedKey)) return resolvedKey;
        }
      } else if (tileKeys.has(key)) {
        return key;
      }
    }
    return null;
  };

  // 1) Exact match (the common, already-canonical case).
  let key = resolveTileKey(decodedMap);
  // 2) Case-insensitive fallback for wrong-cased URLs (crawlers/old links).
  if (!key) {
    const lower = decodedMap.toLowerCase();
    for (const [displayName] of reverseDictMap) {
      if (displayName.toLowerCase() === lower) {
        const resolved = resolveTileKey(displayName);
        if (resolved) {
          key = resolved;
          break;
        }
      }
    }
  }
  // 3) English/default fallback: match the tile key itself or its English
  // defaultTitle. Non-en dicts carry properly localized map names now, so
  // English-named URLs (home cards, hreflang alternates, old bookmarks) no
  // longer reverse-resolve through the locale dict — resolve them here and let
  // the caller 308 to the localized canonical name.
  if (!key) {
    const lower = decodedMap.toLowerCase();
    for (const [tileKey, tile] of Object.entries(version.data.tiles)) {
      if (
        tileKey.toLowerCase() === lower ||
        tile.defaultTitle?.toLowerCase() === lower
      ) {
        key = tileKey;
        break;
      }
    }
  }
  if (!key) return null;

  // Canonical display name = the tile key's own dict term (pointer-resolved),
  // falling back to the key when it has no term.
  const raw = dict[key];
  const name = raw && raw[0] === "@" ? (dict[raw] ?? key) : (raw ?? key);
  return { key, name };
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
  const { url, immutable } = await withContentHash(
    appName,
    `${DATA_FORGE_CDN_URL}/${appName}/dicts/${locale}.json`,
  );
  const dict = await fetchJsonWithMemoryCache<Record<string, string> | null>(
    url,
    { onNotFound: () => null, immutable },
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

/** A game's split-out codex terms (`dicts/db/<locale>.json`), or null if it has none. */
async function fetchDbTerms(
  appName: string,
  locale: string,
): Promise<Record<string, string> | null> {
  const { url, immutable } = await withContentHash(
    appName,
    `${DATA_FORGE_CDN_URL}/${appName}/dicts/db/${locale}.json`,
  );
  const terms = await fetchJsonWithMemoryCache<Record<string, string> | null>(
    url,
    { onNotFound: () => null, immutable },
  );
  if (terms !== null || locale === "en") return terms;
  return fetchDbTerms(appName, "en");
}

const dbDictMerges = new Map<
  string,
  {
    dict: Record<string, string>;
    terms: Record<string, string>;
    merged: Record<string, string>;
  }
>();

/**
 * The dictionary for /db pages: the game's dict merged with its split-out codex terms.
 * data-forge `write({ splitDbDict })` moves codex-only names/descriptions to
 * `dicts/db/<locale>.json` because the interactive map ships its whole dict to the
 * client. Games that don't split have no such file, so this equals `fetchDict`.
 * Pointer keys never collide across the two files (`@…` vs `@d…`).
 */
export async function fetchDbDict(
  appName: string,
  locale: string = "en",
): Promise<Record<string, string>> {
  const [dict, terms] = await Promise.all([
    fetchDict(appName, locale),
    fetchDbTerms(appName, locale),
  ]);
  if (!terms) return dict;
  // Both inputs come from the memory cache, so reuse the merge while they're unchanged.
  const key = `${appName}|${locale}`;
  const cached = dbDictMerges.get(key);
  if (cached && cached.dict === dict && cached.terms === terms) {
    return cached.merged;
  }
  const merged = { ...dict, ...terms };
  dbDictMerges.set(key, { dict, terms, merged });
  return merged;
}

/**
 * Database files go through the memory cache pinned to the content hash, so a
 * crawl across thousands of /db pages costs one CDN fetch per file per server
 * per data update instead of one every minute.
 */
async function fetchDatabaseFile<T>(
  appName: string,
  path: string,
  onNotFound?: () => T,
): Promise<T> {
  const { url, immutable } = await withContentHash(
    appName,
    `${DATA_FORGE_CDN_URL}/${appName}/config/${path}`,
  );
  return fetchJsonWithMemoryCache<T>(url, { onNotFound, immutable });
}

export async function fetchDatabase(appName: string): Promise<DatabaseConfig> {
  return fetchDatabaseFile<DatabaseConfig>(appName, "database.json");
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
  const index = await fetchDatabaseFile<DatabaseConfig | null>(
    appName,
    "database.index.json",
    () => null,
  );
  // Games that ship a single monolith database.json (no split index, e.g. BPSR)
  // fall back to it so the home/db section counts and listings still work.
  return index ?? fetchDatabase(appName);
}

/**
 * Fetch a single type's full database entry (one `{type, items}` category with
 * full `props` per item). Pair with `fetchDatabaseIndex` for cross-link data.
 */
export async function fetchDatabaseType(
  appName: string,
  type: string,
): Promise<DatabaseConfig[number]> {
  const category = await fetchDatabaseFile<DatabaseConfig[number] | null>(
    appName,
    `database.${type}.json`,
    () => null,
  );
  // Games shipping a single monolith database.json (no per-type split — Once
  // Human, Crimson Desert, Dune: Awakening and 11 others) have no such file, so
  // this 404s. A 404 body is not JSON, so `res.json()` threw and EVERY /db page
  // for those games returned 500 in production. Mirror fetchDatabaseIndex and
  // read the category out of the monolith instead.
  //
  // A type genuinely absent from the monolith yields an empty category, so the
  // caller's `items.find(...)` misses and the page 404s — the correct answer for
  // an entry that does not exist. We deliberately do NOT swallow a failing
  // monolith fetch: if neither file is reachable the data is broken, and an error
  // is more useful than silently serving an empty database.
  if (!category) {
    const db = await fetchDatabase(appName);
    return db.find((cat) => cat.type === type) ?? { type, items: [] };
  }
  return category;
}

/**
 * Fetch ONE database entry, for categories the index marks with `entries: true`.
 *
 * Why this exists: rendering a detail page used to `fetchDatabaseType` and then
 * `items.find(i => i.id === id)` — pulling and JSON-parsing up to 1.3 MB to use a
 * few hundred bytes. Measured in production that cost a cold render about +0.15s
 * on the biggest types, which multiplied straight into origin capacity during the
 * 2026-09-13 crawl. Per-entry files cut that to roughly 500 bytes.
 *
 * The body deliberately has NO `icon` (sprite coordinates move on every icon
 * repack, so keeping them out avoids a one-icon change rewriting tens of
 * thousands of files) — read the icon from `fetchDatabaseIndex` instead.
 *
 * Returns null when the entry is not found, so callers can fall back to the full
 * type file rather than 404 a page that genuinely exists.
 */
export async function fetchDatabaseEntry(
  appName: string,
  type: string,
  id: string,
): Promise<DatabaseConfig[number]["items"][number] | null> {
  return fetchDatabaseFile<DatabaseConfig[number]["items"][number] | null>(
    appName,
    `database.${type}/${encodeURIComponent(id)}.json`,
    () => null,
  ).catch(() => null);
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
  /**
   * Set by data-forge on categories that ALSO ship one file per entry at
   * `config/database.<type>/<id>.json` (types big enough that pulling the whole
   * type to render one detail page was expensive). When true, prefer
   * `fetchDatabaseEntry`; when absent, the full type file is the only source.
   * Always treat it as optional — older games keep shipping without it until
   * their next regeneration.
   */
  entries?: boolean;
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
    autoDiscover?: boolean;
    defaultOn?: boolean;
    // Stable identifier shared by all variants of the same underlying entity
    // (base / starred / infected / amber / masked / royal / magical / sized
    // siblings). Used by FilterSettingsPopover to offer a "Enable all
    // variants" toggle. Omitted for filters with no siblings.
    baseType?: string;
    // Codex/database section this marker type has an entry in. When set, the
    // marker panel/tooltip shows a "View in Codex" link to
    // `/db/<dbSection>/<spawn.dbEntryId ?? spawn.id ?? spawn.type>`: a spawn can
    // name its entry explicitly via `dbEntryId` (for position-derived spawn ids),
    // otherwise the DB entry is keyed by the spawn id for per-instance entries —
    // e.g. landmarks — or by the type id for per-type entries — e.g. a bestiary
    // species. Generic across all games.
    dbSection?: string;
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
