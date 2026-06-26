import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {(phase: string) => import('next').NextConfig} */
const nextConfig = (phase) => ({
  // Standalone output for Docker container deployment
  output: "standalone",
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
  //   s-maxage=900:             shared caches (Bunny) keep response 15min
  //   stale-while-revalidate:   serve stale up to 1h while refreshing
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
    const pageCache = [
      {
        key: "Cache-Control",
        value: "public, max-age=0, s-maxage=900, stale-while-revalidate=3600",
      },
      {
        key: "CDN-Cache-Control",
        value: "public, s-maxage=900, stale-while-revalidate=3600",
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
        // immutably. Critical for container deploys: when a new image
        // replaces the old one, the old chunks vanish from origin — a
        // user still on the old HTML relies on the edge having kept
        // them. Without this they'd inherit the 60s s-maxage, get
        // evicted, then 404 into Bunny's HTML → "Unexpected token '<'".
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
