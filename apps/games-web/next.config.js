import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {(phase: string) => import('next').NextConfig} */
const nextConfig = (phase) => ({
  // Standalone output for Docker container deployment
  output: "standalone",
  // Serve hashed build assets from the persistent static host instead of the
  // container. static.th.gl fronts the thgl-games-web-static storage zone,
  // which the deploy workflow populates assets-first (uploads .next/static
  // BEFORE flipping the Magic Container) and which ACCUMULATES builds (60-day
  // retention). Why: chunks that live only in the container image vanish on
  // redeploy, so any open tab or edge-cached older HTML 404'd its chunks
  // after a deploy + purge ("MIME text/plain" / ChunkLoadError — for up to
  // the 1-day page TTL). With the storage origin, old builds' chunks keep
  // resolving no matter what gets purged. A transparent same-origin edge
  // rule was verified NOT to work: Bunny Magic-Container pull zones ignore
  // OriginUrl-override edge rules (tested 2026-07-27; works instantly on
  // URL-origin zones), hence the separate hostname. The static PZ sets
  // immutable Cache-Control + Access-Control-Allow-Origin (fonts need CORS
  // cross-origin) via edge rules. Phase-gated: `next dev` serves same-origin.
  assetPrefix:
    phase === PHASE_DEVELOPMENT_SERVER ? undefined : "https://static.th.gl",
  env: {
    // Dev-only forge proxy: forge URLs become same-origin paths that
    // src/proxy.ts forwards per request — *-dev.localhost tenants (e.g.
    // palia-dev.localhost:3100) hit the local data-forge dev server,
    // every other host the prod endpoints. See FORGE_DEV_PROXY in
    // packages/lib/src/config.ts. Empty string in prod keeps the
    // absolute prod URLs.
    //
    // Keyed off the build PHASE, not NODE_ENV: a `next build` ran with the
    // 2026-06-11 deploy where this evaluated truthy and shipped the dev
    // proxy to production (every forge asset routed through the container
    // and Next rejected /__forge-cdn image URLs carrying ?v= because they
    // weren't in images.localPatterns). PHASE_DEVELOPMENT_SERVER is only
    // ever set by `next dev`, regardless of environment variables.
    NEXT_PUBLIC_FORGE_DEV_PROXY: phase === PHASE_DEVELOPMENT_SERVER ? "1" : "",
  },
  experimental: {
    // Persist Turbopack compiler artifacts to disk between dev runs for
    // faster cold starts after a restart (Next 16 beta).
    turbopackFileSystemCacheForDev: true,
  },
  images: {
    // Next.js 16 blocks optimizing images served from local/private IPs by
    // default (returns 400 "url parameter is not allowed"). In development
    // assets are served from a local host (e.g. localhost:33033 via
    // DATA_FORGE_*), so allow it there. Production assets come from
    // cdn.th.gl, so keep the secure default in prod.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    // Local-src images with a query string are rejected unless allowed
    // here. Forge-proxied assets (dev) carry ?v= cache-busters; bundled
    // public/ assets never have queries.
    localPatterns: [
      { pathname: "/__forge-cdn/**" },
      { pathname: "/**", search: "" },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.th.gl",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        // Release-notes images (Discord bot API) are optimized through
        // next/image. Discord attachment URLs carry a ~24h signed expiry, so
        // "upstream image response failed ... 404" for cdn.discordapp.com is
        // EXPECTED transient noise: the URL refreshes on the next bot-API
        // fetch and the image recovers. Don't remove this pattern because of
        // those logs.
        protocol: "https",
        hostname: "cdn.discordapp.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Next.js sends Cache-Control: private, no-cache, no-store, ... on dynamic
  // routes — Bunny respects `private` and refuses to cache. Override:
  //
  //   max-age=0:                browser always revalidates with edge
  //   s-maxage=86400:           shared caches (Bunny) keep response up to 1 day
  //                             (freshness comes from the per-tenant purge, below)
  //   stale-while-revalidate:   serve stale while refreshing in the background
  //
  // We avoid `must-revalidate` — it forces Bunny to recheck origin on every
  // request, defeating s-maxage. CDN-Cache-Control duplicates s-maxage so
  // Bunny prefers it explicitly.
  //
  // Page content derives from game data that only changes on data-forge
  // deploys, and the deploy workflow purges the pull zone — so a long
  // s-maxage is safe. Exceptions below: dashboard (user-specific) and the
  // palia-api-driven pages (purged on update via /api/revalidate).
  //
  // RSC responses ARE edge-cached: Next.js returns different content
  // (text/html vs text/x-component) for the same path based on the `RSC`
  // request header, and Bunny ignores the HTTP Vary header — but two
  // mechanisms keep the cache keys distinct: (1) client navigations append
  // a unique `?_rsc=<hash>` param derived from the RSC request headers
  // (Next's CDN cache-busting param, part of the URL cache key), and
  // (2) the pull zone sets CacheKeyHeaders="rsc" so the header itself is
  // part of the Bunny cache key. Caching RSC matters: prefetches fire one
  // request per visible link, which used to be 100% origin traffic.
  headers: async () => {
    // s-maxage=86400 (1 day): freshness no longer rides the TTL — data-forge's
    // sync:bunny purges each updated tenant's pages via /api/revalidate the moment
    // its data goes live (see the endpoint), so pages render once and stay cached
    // until the data actually changes. The 1-day ceiling only bounds staleness if a
    // purge is ever missed; Bunny's stale-while-revalidate + UseStaleWhileUpdating
    // serve the cached copy while a background re-render runs.
    //
    // BROWSER staleness is bounded SEPARATELY and much tighter (SWR=60, not 86400).
    // The server-rendered HTML embeds content-hashed asset URLs (e.g. the icon
    // sprite icons.<hash>.webp). When data-forge ships a new sprite it PRUNES the
    // old hash from the CDN, so a browser that keeps day-old HTML would request a
    // hash that now 404s → invisible icons (and a hard refresh doesn't reliably
    // bust a `stale-while-revalidate` entry, so real users get stuck). The edge is
    // purged the moment data goes live, so the browser gains nothing from a 24h
    // stale window — cap it at 60s (same budget as version.json / the config JSONs)
    // so a data update always reaches the browser within a minute. The edge keeps
    // its day-cache + SWR (CDN-Cache-Control below) for origin protection.
    const pageCache = [
      {
        key: "Cache-Control",
        value: "public, max-age=0, s-maxage=86400, stale-while-revalidate=60",
      },
      {
        key: "CDN-Cache-Control",
        value: "public, s-maxage=86400, stale-while-revalidate=86400",
      },
    ];
    // User-specific (dashboard, cookie-varied) and palia-api-driven pages
    // (leaderboard etc. — purged per-tag, but localized variants rely on
    // expiry) keep the short TTL so updates show within a minute.
    const shortCache = [
      {
        key: "Cache-Control",
        value: "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
      },
      {
        key: "CDN-Cache-Control",
        value: "public, s-maxage=60, stale-while-revalidate=300",
      },
    ];
    // The companion-app auto-update gate: version.txt + THGL_Installer.exe. These MUST NOT ride
    // the 15-min page cache. A stale version.txt makes clients keep polling the old version; worse,
    // if version.txt goes fresh while the installer edge copy is still the old build (or vice
    // versa), clients see a version the installer can't deliver and get stuck in an update loop.
    // Very short + tiny SWR so a release propagates in ~30s and the two files always flip together
    // (both served from the same container). No `stale-while-revalidate` sprawl here on purpose.
    const updateGateCache = [
      {
        key: "Cache-Control",
        value: "public, max-age=0, s-maxage=30, stale-while-revalidate=30",
      },
      {
        key: "CDN-Cache-Control",
        value: "public, s-maxage=30, stale-while-revalidate=30",
      },
    ];
    // Baseline security headers applied to every response. Deliberately
    // conservative: HSTS + nosniff + a private-friendly Referrer-Policy are
    // safe network-wide. We intentionally OMIT a Content-Security-Policy and
    // X-Frame-Options here — a strict CSP would break the Nitropay/GPT ad
    // stack (dozens of third-party origins) and X-Frame-Options would break
    // the desktop/overlay WebView that embeds tenant pages in an iframe.
    // includeSubDomains is safe (every *.th.gl host is already HTTPS); we
    // skip `preload` to avoid the irreversible preload-list commitment.
    const securityHeaders = [
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains",
      },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ];
    const rules = [
      { source: "/:path*", headers: securityHeaders },
      { source: "/:path*", headers: pageCache },
      // Build-identity probe (NewVersionWatcher polling + the deploy workflow's
      // drain detection). Must reflect the LIVE container on every request, so
      // it must come AFTER the pageCache /:path* rule to override s-maxage.
      {
        source: "/api/build-id",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "CDN-Cache-Control", value: "no-store" },
        ],
      },
      // Patreon perks/auth family — per-user AND credentialed: these routes read
      // cookies and return account data (email/perks) + Set-Cookie, with a
      // per-Origin ACAO header. They MUST NOT be edge-cached. The generic
      // pageCache /:path* rule (s-maxage=86400, no Vary) would otherwise cache a
      // SINGLE response and serve it to every origin/user for a day — that both
      // breaks CORS (a cached `*`/wrong-origin ACAO is rejected by credentialed
      // fetches, e.g. account.tsx's `credentials: "include"` call) and leaks one
      // user's perks/email to the next. Comes AFTER the pageCache rule to override
      // s-maxage; covers the exact path and the OAuth sub-routes (redirect/etc.).
      {
        source: "/api/patreon",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "CDN-Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/api/patreon/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "CDN-Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/www/api/patreon/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "CDN-Cache-Control", value: "no-store" },
        ],
      },
      // Status API — the status page + in-app banners poll this, so it must
      // reflect reality within a minute (spec: 60s CDN cache). Comes AFTER
      // the pageCache /:path* rule to override the 1-day s-maxage.
      { source: "/api/status", headers: shortCache },
      // The status PAGE must not ride the 1-day page cache either — a
      // stale "all operational" during an incident defeats its purpose.
      // status.th.gl requests arrive as "/" (host alias, rewritten to
      // /www/status by the proxy), so a host-scoped rule covers them;
      // the path rules cover www.th.gl/status (dev/direct) + the
      // rewritten internal path.
      {
        source: "/:path*",
        has: [{ type: "host", value: "status.th.gl" }],
        headers: shortCache,
      },
      { source: "/status", headers: shortCache },
      { source: "/www/status", headers: shortCache },
      // The cron-triggered runner has side effects and an Authorization
      // gate — a cached 401/response would wedge the whole checker.
      {
        source: "/api/status/run",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "CDN-Cache-Control", value: "no-store" },
        ],
      },
      // Auto-update gate — must come AFTER the pageCache /:path* rule so it overrides s-maxage.
      // app.th.gl serves these at the root (/version.txt); the middleware also rewrites to
      // /games/thgl-app/*, so cover both the incoming and rewritten paths.
      { source: "/version.txt", headers: updateGateCache },
      { source: "/THGL_Installer.exe", headers: updateGateCache },
      { source: "/games/thgl-app/version.txt", headers: updateGateCache },
      {
        source: "/games/thgl-app/THGL_Installer.exe",
        headers: updateGateCache,
      },
      { source: "/dashboard/:path*", headers: shortCache },
      { source: "/:locale/dashboard/:path*", headers: shortCache },
      {
        source: "/:page(leaderboard|rummage-pile|weekly-wants)",
        headers: shortCache,
      },
      {
        source: "/:locale/:page(leaderboard|rummage-pile|weekly-wants)",
        headers: shortCache,
      },
    ];

    // The /_next/static and /_next/image overrides are PRODUCTION-ONLY.
    // In `next dev` they break HMR — immutable caching serves stale
    // chunks — and Next.js warns about custom Cache-Control on these
    // routes. They aren't needed in dev (no CDN, no deploys) and only
    // earn their keep behind Bunny in prod. Phase check, not NODE_ENV —
    // same reasoning as NEXT_PUBLIC_FORGE_DEV_PROXY above.
    if (phase !== PHASE_DEVELOPMENT_SERVER) {
      rules.push(
        // Hashed build assets are content-addressed (the hash is in the
        // filename), so a given URL's bytes never change. Cache them
        // immutably. NOTE: in production these are normally served from
        // static.th.gl via assetPrefix (see top of config) — the durable
        // storage origin that survives redeploys and purges. This header
        // rule covers the container's own copy: same-origin /_next/static
        // requests from pre-assetPrefix HTML still in edge caches, and
        // as a fallback if assetPrefix is ever removed.
        {
          source: "/_next/static/:path*",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
            {
              key: "CDN-Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ],
        },
        // Optimized images keyed by (url, w, q). Source files (map-tile
        // previews, etc.) can change under a stable URL, so don't make
        // these immutable — cache a day at the edge with a week of SWR,
        // and let the browser revalidate hourly via ETag.
        {
          source: "/_next/image",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=3600, must-revalidate",
            },
            {
              key: "CDN-Cache-Control",
              value: "public, s-maxage=86400, stale-while-revalidate=604800",
            },
          ],
        },
      );
    }

    return rules;
  },
});

export default nextConfig;
