import { getAppIdFromPathname } from "./games";

/**
 * Companion App content surface: a game's codex (/db), guides and tools served
 * inside the THGLApp WebView at `app.th.gl/[locale/]apps/<id>/<page>`.
 *
 * `proxy.ts` rewrites those URLs onto the game's own routes (the same pages as
 * `<game>.th.gl/<page>`) and tags the request with the headers below, so the
 * root layout renders the app chrome instead of the website header. The browser
 * URL stays under `/apps/<id>/`: THGLApp tags a WebView with its game from that
 * path (live-data routing, window settings, locale re-navigation) and the app
 * tenant has no unprefixed `/db` routes. Every in-app link therefore goes
 * through `toAppSurfacePath` (the shell's click interceptor does it for plain
 * links; proxy.ts redirects the rest by Referer).
 */
export const APP_SURFACE_HEADER = "x-thgl-surface";
/** The game id from the `/apps/<id>/` URL segment (set next to APP_SURFACE_HEADER). */
export const APP_SURFACE_GAME_HEADER = "x-thgl-app-game";

/** `/apps/<id>/<sub>` pages that belong to the app itself, not the game site. */
const APP_OWN_SUBPATHS = new Set(["overlay"]);

export type AppSurfacePath = {
  /** "" or "/de" */
  localePrefix: string;
  gameId: string;
  /** Path after `/apps/<id>`, "" for the map page itself ("/db/x", "/overlay", …). */
  rest: string;
};

/**
 * Split an app.th.gl pathname into locale, game id and sub path. Returns null for
 * paths outside `/[locale/]apps/<id>`.
 */
export function parseAppPath(pathname: string): AppSurfacePath | null {
  const segs = pathname.split("/");
  let i = 1;
  let localePrefix = "";
  if (segs[1] !== "apps" && segs[2] === "apps") {
    localePrefix = `/${segs[1]}`;
    i = 2;
  }
  if (segs[i] !== "apps" || !segs[i + 1]) return null;
  const rest = segs.slice(i + 2).join("/");
  return {
    localePrefix,
    gameId: segs[i + 1],
    rest: rest ? `/${rest}` : "",
  };
}

/** True for a `/apps/<id>/<page>` URL that renders game content (codex, guides, tools). */
export function isAppContentPath(pathname: string): boolean {
  const parsed = parseAppPath(pathname);
  if (!parsed || !parsed.rest) return false;
  return !APP_OWN_SUBPATHS.has(parsed.rest.split("/")[1]);
}

/** True for the in-game overlay WebView (`/apps/<id>/overlay`). */
export function isAppOverlayPath(pathname: string): boolean {
  return parseAppPath(pathname)?.rest.split("/")[1] === "overlay";
}

/**
 * Prefix a site-relative game path with `/apps/<id>`, keeping its locale first:
 * `/de/db/x?q=1` → `/de/apps/<id>/db/x?q=1`, `/` → `/apps/<id>` (the map).
 * Absolute URLs and paths already under `/apps/` pass through unchanged.
 */
export function toAppSurfacePath(
  href: string,
  gameId: string,
  locales: readonly string[],
): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  if (getAppIdFromPathname(href)) return href;
  const first = href.split(/[/?#]/)[1];
  const localePrefix = first && locales.includes(first) ? `/${first}` : "";
  let rest = href.slice(localePrefix.length);
  // "/", "/?q", "" and "?q" all address the game root = the app's map page.
  if (rest === "/" || rest.startsWith("/?") || rest.startsWith("/#")) {
    rest = rest.slice(1);
  }
  return `${localePrefix}/apps/${gameId}${rest}`;
}

/**
 * A same-origin game API path (`/api/db/…`) for a browser fetch. Those routes
 * resolve the game from the request host, which on app.th.gl is the app — so
 * inside the app they go through `/apps/<id>/api/…` (proxy.ts rewrites it with
 * the game attached; the per-game URL also keeps edge-cache entries apart).
 */
export function gameApiUrl(path: string): string {
  if (typeof window === "undefined") return path;
  const parsed = parseAppPath(window.location.pathname);
  return parsed ? `/apps/${parsed.gameId}${path}` : path;
}
