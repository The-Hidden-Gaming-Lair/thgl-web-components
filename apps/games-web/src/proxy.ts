import { NextRequest, NextResponse } from "next/server";
import {
  FORGE_API_PROXY_PATH,
  FORGE_CDN_PROXY_PATH,
  getForgeProxyTarget,
} from "@repo/lib";
import { getAppConfigByHost } from "./configs";

/**
 * Hostname-based multi-tenancy.
 *
 * For each request, look up the app config by the Host header (e.g.
 * "avowed.th.gl" → "avowed"). If matched, set an `x-thgl-app` header
 * downstream so that server components can resolve the right config
 * via getAppConfig(). If no app matches, let the request through
 * unchanged — the layout will 404 via notFound().
 *
 * Per-game static assets (favicon, OG image) live under public/games/<slug>/
 * and are rewritten transparently based on the host.
 *
 * Next.js 16 renamed the `middleware` convention to `proxy` (Node.js
 * runtime). This file uses no edge-only APIs — Buffer and process.env
 * are natively available — so the switch is behaviour-preserving.
 */
export function proxy(req: NextRequest) {
  const host = req.headers.get("host") || "";

  // Redirect the apex domain (th.gl) to the canonical www host. Both
  // resolve to the same Bunny pull zone, but having two hostnames
  // serve identical content creates duplicate-content SEO issues. 308
  // preserves the request method + path + query.
  if (host === "th.gl" || host.startsWith("th.gl:")) {
    const url = req.nextUrl.clone();
    url.host = "www.th.gl";
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  // Dev-only forge proxy. In `next dev` the forge URL constants are
  // same-origin paths (see FORGE_DEV_PROXY in @repo/lib). Forward them
  // per request: *-dev.localhost tenants (palia-dev.localhost:3100) to
  // the local data-forge dev server, everything else to the prod
  // endpoints. Keeping the rendered markup host-independent is what
  // makes per-tab switching work without hydration mismatches or CORS.
  if (process.env.NODE_ENV === "development") {
    const target = getForgeProxyTarget(host, req.nextUrl.pathname);
    if (target) {
      const prefix = req.nextUrl.pathname.startsWith(`${FORGE_CDN_PROXY_PATH}/`)
        ? FORGE_CDN_PROXY_PATH
        : FORGE_API_PROXY_PATH;
      return NextResponse.rewrite(
        new URL(
          req.nextUrl.pathname.slice(prefix.length) + req.nextUrl.search,
          target,
        ),
      );
    }
  }

  const config = getAppConfigByHost(host);

  if (!config) {
    return NextResponse.next();
  }

  const url = req.nextUrl;
  const path = url.pathname;

  // Rewrite per-game OG images (favicon is shared, served from app/favicon.ico)
  if (
    path === "/opengraph-image.jpg" ||
    path === "/activities-tracker/opengraph-image.jpg"
  ) {
    url.pathname = `/games/${config.name}${path}`;
    return NextResponse.rewrite(url);
  }

  // Per-game raw assets bundled under public/games/<slug>/. Used by game
  // components that reference root-relative paths (e.g. dune-awakening's
  // <DuneHeatmaps> loads "/heatmaps/<name>.webp").
  if (path.startsWith("/heatmaps/")) {
    url.pathname = `/games/${config.name}${path}`;
    return NextResponse.rewrite(url);
  }

  // thgl-app's root-level static assets — the native client downloads
  // these from app.th.gl by exact path (installer + auto-update manifest
  // + version marker), so we keep the URL but bundle the files under
  // public/games/thgl-app/.
  // cave128.png isn't in this list — it's only referenced from inside
  // dashboard / elevation-prompt via <Image src="/games/thgl-app/...">,
  // and next/image reads public/ via filesystem (bypasses middleware).
  if (
    config.name === "thgl-app" &&
    (path === "/THGL_Installer.exe" ||
      path === "/manifest.bin" ||
      path === "/version.txt")
  ) {
    url.pathname = `/games/thgl-app${path}`;
    return NextResponse.rewrite(url);
  }

  // thgl-app Patreon OAuth entrypoint. Done in middleware (not next.config
  // redirects) because the `has: { type: "host" }` rule there only does
  // exact-string matching, breaking `app.localhost:3100` in dev. We
  // already have host resolution here.
  // /authenticate is the Patreon OAuth entry point. Production: only
  // thgl-app (app.th.gl) uses it — other tenants 404. Dev: allow it
  // on any tenant subdomain so developers can sign in directly on
  // paxdei.localhost / avowed.localhost / etc., avoiding the
  // cross-subdomain cookie scoping mess that plagues *.localhost.
  if (
    path === "/authenticate" &&
    (config.name === "thgl-app" || process.env.NODE_ENV === "development")
  ) {
    // Derive redirect_uri from request host (app.th.gl → app.th.gl,
    // app.localhost:3100 → app.localhost:3100, paxdei.localhost:3100
    // → paxdei.localhost:3100 in dev). Must match what
    // /api/patreon/redirect sends in postToken — both use the host
    // header so they stay in sync. Each tenant subdomain needs its
    // exact redirect URI on Patreon's allowlist.
    const host = req.headers.get("host") ?? "app.th.gl";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/patreon/redirect`;
    // Encode return_to in the OAuth `state` so the redirect handler
    // can bounce the user back to the page they came from. We keep
    // the allow-list simple: same-host only (no open redirector).
    const returnToRaw = url.searchParams.get("return_to") ?? "";
    let stateParam = "";
    if (returnToRaw) {
      try {
        const parsed = new URL(returnToRaw);
        if (parsed.host === host) {
          stateParam = Buffer.from(
            JSON.stringify({ return_to: returnToRaw }),
          ).toString("base64url");
        }
      } catch {
        // ignore malformed return_to
      }
    }
    const oauthParams = new URLSearchParams({
      response_type: "code",
      client_id: process.env.PATREON_CLIENT_ID ?? "",
      redirect_uri: redirectUri,
    });
    if (stateParam) oauthParams.set("state", stateParam);
    const dest = `https://www.patreon.com/oauth2/authorize?${oauthParams}`;
    return NextResponse.redirect(dest, 302);
  }

  // thgl-web shortcut redirects (ported from the old thgl-web Vercel
  // next.config.js). Done in middleware (not next.config.js redirects)
  // for the same reason as /authenticate — `has: { type: "host" }`
  // does exact-string matching and breaks `www.localhost:3100` in dev.
  if (config.name === "thgl-web") {
    if (path === "/support-me/patreon") {
      url.pathname = "/api/patreon/authorize";
      return NextResponse.redirect(url, 302);
    }
    if (path === "/discord") {
      return NextResponse.redirect(
        "https://discord.com/invite/the-hidden-gaming-lair-320539672663031818",
        302,
      );
    }
    if (path === "/ads.txt") {
      return NextResponse.redirect(
        "https://api.nitropay.com/v1/ads-1487.txt",
        301,
      );
    }
  }

  // Shared cross-tenant game icons bundled under public/games/thgl-web/
  // global_icons/ are referenced by absolute URL (`https://www.th.gl/
  // global_icons/...`) from games.ts, whats-new, and game-switcher so
  // every tenant resolves the same sprite. Without this rewrite the
  // catch-all below sends the request to /www/global_icons/* which has
  // no route, and the Bunny container falls back to its deploy
  // placeholder HTML — Chrome's ORB then blocks the cross-origin
  // image fetch.
  if (config.name === "thgl-web" && path.startsWith("/global_icons/")) {
    url.pathname = `/games/thgl-web${path}`;
    return NextResponse.rewrite(url);
  }

  // thgl-web (marketing site at www.th.gl) is mounted at app/www/ on
  // disk to avoid URL collisions with thgl-app (`/apps/[id]`,
  // `/api/patreon/redirect`) and the tenant home (`/`). Rewrite every
  // www.th.gl request transparently.
  //
  // Originally used `_www/` but Next.js treats `_`-prefixed folders as
  // private (opted out of routing entirely), so the routes silently
  // dropped from the build.
  //
  // Exemptions:
  //   - `/www/*`: already rewritten (paranoia — idempotent on re-entry).
  //   - `/games/thgl-web/*`: per-tenant public assets bundled there
  //     (matches the thgl-app pattern). <Image src="/games/thgl-web/...">
  //     references in thgl-web components bypass middleware and hit the
  //     public folder directly via next/image's filesystem reader.
  if (
    config.name === "thgl-web" &&
    !path.startsWith("/www/") &&
    !path.startsWith("/games/thgl-web/") &&
    path !== "/favicon.ico" && // Shared root favicon (app/favicon.ico); a
    // nested app/www/favicon.ico is not a served route, so rewriting here 404s.
    !path.startsWith("/api/filters") && // Global API, lives at app/api/filters
    path !== "/api/build-id" && // Global build-identity probe (deploy drain
    // detection + NewVersionWatcher) — must answer on every host incl. www.
    path !== "/api/patreon" // Global perks-refresh route (exact match).
    // /api/patreon/authorize, /api/patreon/overwolf, and
    // /api/patreon/redirect still rewrite to /www/ — those handlers
    // are www-tenant-only in prod.
  ) {
    url.pathname = `/www${path}`;
    return NextResponse.rewrite(url);
  }

  // Once-human: legacy section URLs (/weapons, /remnants, etc.) moved
  // under /db/* during the games-web migration. Permanent-redirect the
  // old paths so external links + Search Console history stay intact.
  if (config.name === "once-human") {
    const legacy = ONCE_HUMAN_LEGACY_REDIRECTS.find((r) => r.test.test(path));
    if (legacy) {
      url.pathname = path.replace(legacy.test, legacy.replacement);
      return NextResponse.redirect(url, 308);
    }
  }

  // Songs of Conquest: legacy standalone-site URLs (/units/Arleon/Ranger,
  // /wielders/X, /buildings/F/N, …) → new /db/<singular>/<slug> codex paths.
  // Unlike once-human these need slug transformation (lowercase + join with _),
  // so they can't be plain next.config redirects.
  if (config.name === "songs-of-conquest") {
    // Legacy /privacy (+ /<locale>/privacy) → the canonical THGL privacy policy
    // on www (the standalone site's own privacy page isn't carried over).
    if (/^(\/[a-z-]+)?\/privacy\/?$/.test(path)) {
      return NextResponse.redirect("https://www.th.gl/privacy-policy", 308);
    }
    const dest = socLegacyRedirect(path, config.supportedLocales);
    if (dest && dest !== path) {
      url.pathname = dest;
      return NextResponse.redirect(url, 308);
    }
  }

  const headers = new Headers(req.headers);
  headers.set("x-thgl-app", config.name);

  return NextResponse.next({ request: { headers } });
}

/**
 * Map a legacy soc.th.gl path to its games-web `/db/*` equivalent (or null if
 * it isn't a legacy codex path). Mirrors the data-mining `slug()` exactly so
 * old deep links + Search Console history resolve to the migrated entry.
 *
 *   /units/Arleon/Ranger        → /db/unit/arleon_ranger
 *   /buildings/Arleon/Farm      → /db/building/arleon_farm
 *   /random-events/Generic/Foo  → /db/random-event/generic_foo
 *   /wielders                   → /db/wielder        (section index)
 *   /towns/Arleon               → /db/town/arleon    (interactive build planner)
 *   /savegames                  → /db/savegame
 *   /de/units/Arleon/Ranger     → /de/db/unit/arleon_ranger (locale preserved)
 */
const SOC_SECTION_MAP: Record<string, string> = {
  units: "unit",
  wielders: "wielder",
  skills: "skill",
  spells: "spell",
  artifacts: "artifact",
  buildings: "building",
  factions: "faction",
  "random-events": "random-event",
};

function socSlug(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

function socLegacyRedirect(
  path: string,
  supportedLocales: string[],
): string | null {
  const segs = path.split("/").filter(Boolean);
  if (!segs.length) return null;
  // Preserve a leading locale segment (e.g. /de/units/...).
  let localePrefix = "";
  if (supportedLocales.includes(segs[0])) {
    localePrefix = `/${segs[0]}`;
    segs.shift();
  }
  if (!segs.length) return null;

  if (segs[0] === "towns") {
    return segs[1]
      ? `${localePrefix}/db/town/${socSlug(segs[1])}`
      : `${localePrefix}/db/town`;
  }
  if (segs[0] === "savegames") return `${localePrefix}/db/savegame`;
  const newSection = SOC_SECTION_MAP[segs[0]];
  if (!newSection) return null;
  if (segs.length === 1) return `${localePrefix}/db/${newSection}`;
  return `${localePrefix}/db/${newSection}/${socSlug(segs.slice(1).join("_"))}`;
}

/**
 * Map every old once-human-web top-level section path to its new
 * `/db/*` home. Entries are tried in order, so list the most specific
 * patterns (with `/:id`) before the bare section index.
 *
 * The regex uses a leading anchor so we don't accidentally rewrite
 * arbitrary substrings — only the exact path stem matches.
 */
const ONCE_HUMAN_LEGACY_REDIRECTS: Array<{
  test: RegExp;
  replacement: string;
}> = [
  { test: /^\/weapons(\/.*)?$/, replacement: "/db/weapons$1" },
  { test: /^\/remnants(\/.*)?$/, replacement: "/db/remnants$1" },
  {
    test: /^\/regional-records(\/.*)?$/,
    replacement: "/db/regional-records$1",
  },
  {
    test: /^\/echoes-of-stardust(\/.*)?$/,
    replacement: "/db/echoes-of-stardust$1",
  },
  { test: /^\/mod-locations(\/.*)?$/, replacement: "/db/mod-locations$1" },
  {
    test: /^\/deviant-locations(\/.*)?$/,
    replacement: "/db/deviant-locations$1",
  },
];

export const config = {
  // Run middleware on everything except Next internals and robots.txt.
  // robots.ts only auto-routes at the top-level app/, so we serve all
  // tenants' robots from app/robots.ts (multiTenant-dispatched).
  // Skipping /robots.txt here keeps the thgl-web rewrite from sending
  // it to a path Next can't resolve.
  matcher: ["/((?!_next/|robots\\.txt).*)"],
};
