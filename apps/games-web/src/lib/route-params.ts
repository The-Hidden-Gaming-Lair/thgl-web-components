import { headers } from "next/headers";
import { game, surface } from "next/root-params";
import {
  fetchVersion,
  setRequestHostResolver,
  setVersionObserver,
} from "@repo/lib";

/**
 * Game pages live under the internal route `/g/[game]/[surface]/[locale]/…`
 * (src/app/g). proxy.ts rewrites every public game URL onto it, e.g.
 *
 *   palia.th.gl/de/db/items/x          → /g/palia/web/de/db/items/x
 *   app.th.gl/apps/palia/db/items/x    → /g/palia/app/en/db/items/x
 *   palia.th.gl/embed/maps/Kilima      → /g/palia/embed/en/maps/Kilima
 *
 * The game and surface used to travel as request headers, which made every
 * page dynamic (headers() opts out of caching). As ROOT params
 * (`next/root-params`) they are readable anywhere in the server tree and
 * work in cached (force-static / ISR) renders, so pages can be served from
 * Next's cache instead of re-rendering on every edge miss.
 *
 * Surface values: "web" | "app" | "embed", with a "-dev" suffix on the local
 * dev server for `*-dev.localhost` hosts (their pages read the local
 * data-forge instead of prod — see FORGE_DEV_PROXY in @repo/lib).
 */
export type Surface = "web" | "app" | "embed";

export const SURFACES: readonly Surface[] = ["web", "app", "embed"];

export function encodeSurface(s: Surface, devForge: boolean): string {
  return devForge ? `${s}-dev` : s;
}

export function decodeSurface(
  raw: string | undefined,
): { surface: Surface; devForge: boolean } | undefined {
  if (!raw) return undefined;
  const devForge = raw.endsWith("-dev");
  const s = (devForge ? raw.slice(0, -4) : raw) as Surface;
  return SURFACES.includes(s) ? { surface: s, devForge } : undefined;
}

/** The [game] root param, or undefined outside the /g tree (API routes, www, app). */
export async function getRouteGame(): Promise<string | undefined> {
  try {
    return (await game()) || undefined;
  } catch {
    return undefined;
  }
}

/** The decoded [surface] root param, or undefined outside the /g tree. */
export async function getRouteSurface(): Promise<
  { surface: Surface; devForge: boolean } | undefined
> {
  try {
    return decodeSurface(await surface());
  } catch {
    return undefined;
  }
}

/**
 * Host used by @repo/lib's resolveForgeUrl() to pick local vs prod data-forge
 * on the dev server (`*-dev.localhost` → local). Inside the /g tree the host
 * header is unavailable in cached renders, so derive it from the route: the
 * surface carries the dev flag. Elsewhere (API routes, www) fall back to the
 * request's Host header. Replaces the headers-only resolver from
 * instrumentation.ts as soon as any server code imports this module.
 */
setRequestHostResolver(async () => {
  const [g, s] = await Promise.all([getRouteGame(), getRouteSurface()]);
  if (g && s) return s.devForge ? `${g}-dev.localhost` : `${g}.th.gl`;
  try {
    return (await headers()).get("host");
  } catch {
    return null;
  }
});

/**
 * Data-version feed for the page cache (cache-handler.cjs): every version.json
 * a render loads is recorded per game, and the handler can request a refresh
 * for a game no render has looked at recently. Shared via globalThis because
 * the cache handler is loaded by Next's server outside the app bundle.
 */
const versions = ((globalThis as Record<string, unknown>).__thglDataVersions ??=
  new Map()) as Map<string, { id: string; at: number }>;
setVersionObserver((appName, id) => {
  versions.set(appName, { id, at: Date.now() });
});
(globalThis as Record<string, unknown>).__thglRefreshDataVersion = (
  appName: string,
) => fetchVersion(appName);
