/**
 * Embeddable maps: `<domain>.th.gl/[locale/]embed/maps/<Map>` renders the map
 * page without the website chrome (no header, footer, filter panel or ads) so
 * other sites can put it in an iframe.
 *
 * `proxy.ts` rewrites those URLs onto the normal `/maps/<Map>` route and tags
 * the request with `APP_SURFACE_HEADER: embed`, so the root layout and the map
 * page render the embed variant. The browser URL keeps the `/embed` prefix
 * (separate edge-cache entry, separate local storage - see isEmbedPath).
 *
 * Query parameters (all optional):
 *   center=<lat>,<lng>  zoom=<n>     initial view
 *   types=<id>,<id>     marker types to show (filter value ids; default = the
 *                       map's default filters)
 *   hide=<id>,<id>      the inverse: every marker type except these
 *   share=<code>        a player's shared custom filter (markers + drawings)
 */
export const EMBED_SURFACE = "embed";

/** www.th.gl page that documents embeds + the tooltip script. */
export const DEVELOPERS_URL = "https://www.th.gl/developers";

/**
 * True for an embed page (`/embed/maps/…`, `/<locale>/embed/maps/…`). Embeds
 * keep their own local storage so an embedded view never overwrites the
 * visitor's own map state on the game site (same-site iframes share storage).
 */
export function isEmbedPath(pathname: string): boolean {
  return /^(\/[a-zA-Z-]+)?\/embed\/maps(\/|$)/.test(pathname);
}

/**
 * Split an embed pathname into its locale prefix and the map route it renders:
 * `/de/embed/maps/X` → { localePrefix: "/de", mapPath: "/maps/X" }.
 * Returns null for anything else.
 */
export function parseEmbedPath(
  pathname: string,
  locales: readonly string[],
): { localePrefix: string; mapPath: string } | null {
  const segs = pathname.split("/");
  let i = 1;
  let localePrefix = "";
  if (segs[1] && segs[1] !== "embed" && locales.includes(segs[1])) {
    localePrefix = `/${segs[1]}`;
    i = 2;
  }
  if (segs[i] !== "embed" || segs[i + 1] !== "maps" || !segs[i + 2]) {
    return null;
  }
  return { localePrefix, mapPath: `/${segs.slice(i + 1).join("/")}` };
}

export type EmbedMapOptions = {
  /** Tenant subdomain (AppConfig.domain). */
  domain: string;
  /** Map title as it appears in the /maps/<title> URL (decoded). */
  mapTitle: string;
  /** Locale prefix, omitted for the default locale. */
  locale?: string;
  center?: [number, number];
  zoom?: number;
  /** Filter value ids to show; omitted = the map's defaults. */
  types?: string[];
  /** Filter value ids to hide (all others shown); ignored with `types`. */
  hide?: string[];
  /** Share code of a player's custom filter. */
  share?: string;
};

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

function mapPath({ mapTitle, locale }: EmbedMapOptions): string {
  const prefix = locale && locale !== "en" ? `/${locale}` : "";
  return `${prefix}/maps/${encodeURIComponent(mapTitle)}`;
}

/** Full-page map URL on the game site (the attribution link target). */
export function buildFullMapUrl(options: EmbedMapOptions): string {
  return `https://${options.domain}.th.gl${mapPath(options)}`;
}

/** The iframe `src` for an embedded map. */
export function buildEmbedUrl(options: EmbedMapOptions): string {
  const params = new URLSearchParams();
  if (options.center) {
    params.set(
      "center",
      `${round(options.center[0], 2)},${round(options.center[1], 2)}`,
    );
  }
  if (options.zoom !== undefined && Number.isFinite(options.zoom)) {
    params.set("zoom", String(round(options.zoom, 2)));
  }
  if (options.types && options.types.length > 0) {
    params.set("types", options.types.join(","));
  } else if (options.hide && options.hide.length > 0) {
    params.set("hide", options.hide.join(","));
  }
  if (options.share) {
    params.set("share", options.share);
  }
  const path = mapPath(options).replace("/maps/", "/embed/maps/");
  const query = params.toString().replace(/%2C/g, ",");
  return `https://${options.domain}.th.gl${path}${query ? `?${query}` : ""}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Copy-paste HTML for an embedded map. The attribution link sits OUTSIDE the
 * iframe: a link inside the frame belongs to our own document and does not
 * credit the embedding page's link to us.
 */
export function buildEmbedSnippet(
  options: EmbedMapOptions & {
    /** e.g. "Palia" */
    gameTitle: string;
    /** Display name of the map, e.g. "Kilima Valley". */
    mapDisplayName: string;
    height?: number;
  },
): string {
  const src = escapeHtml(buildEmbedUrl(options));
  const href = escapeHtml(buildFullMapUrl(options));
  const title = escapeHtml(
    `${options.gameTitle} ${options.mapDisplayName} Interactive Map`,
  );
  const linkText = escapeHtml(`${options.gameTitle} Interactive Map`);
  const height = options.height ?? 480;
  return [
    `<iframe src="${src}" title="${title}" width="100%" height="${height}" style="border:0;border-radius:8px" loading="lazy" allowfullscreen></iframe>`,
    `<p style="margin:4px 0 0;font-size:13px"><a href="${href}">${linkText}</a> by The Hidden Gaming Lair</p>`,
  ].join("\n");
}
