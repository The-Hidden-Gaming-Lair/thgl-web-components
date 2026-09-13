// Reports which build the LIVE container is running (git SHA baked in via the
// Docker build-arg GIT_SHA → NEXT_PUBLIC_BUILD_SHA). Two consumers:
//
//  1. NewVersionWatcher (client): polls this to offer a click-to-reload toast
//     when the deployed build no longer matches the one the tab is running.
//  2. games-web-deploy.yml: probes this (with a cache-busting query) to detect
//     when the old container instance has fully drained before purging pages.
//
// Cached SHORT, not no-store (changed 2026-09-13). Every open tab polls this
// every 5 min, so at no-store it was the biggest uncacheable origin consumer on
// the site (~236 origin-req/min over 33 distinct URLs, 0% edge-hit) and it grew
// linearly with the audience. s-maxage=30 makes that cost O(tenants) instead of
// O(users). next.config.js sets the same pair on /api/build-id (it must come
// after the generic /:path* pageCache rule, which would otherwise apply
// s-maxage=86400); we repeat it here so the handler and the config agree.
//
// The browser copy stays uncached (max-age=0) and the deploy workflow's drain
// probe cache-busts with ?drain=<run-id>-<i>, so both still observe live
// per-instance state. Rationale + the IgnoreQueryStrings caveat: next.config.js.
//
// NOTE the route is build-id, NOT build: .dockerignore excludes `**/build`
// (build-output hygiene), so a folder named src/app/api/build is silently
// dropped from the Docker build context — the route then 404s in production
// while working locally.
export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json(
    {
      // Per-deploy identity (git commit) — consumed by the deploy workflow's
      // drain probe, which must distinguish container instances even when the
      // web app itself is unchanged.
      sha: process.env.NEXT_PUBLIC_BUILD_SHA ?? "dev",
      // Client-bundle identity — consumed by NewVersionWatcher. Hashes only
      // the client-relevant source trees (workflow "Compute client build
      // identity"), so installer/OG-image-only deploys keep the same value
      // and open tabs aren't prompted to reload an unchanged web app.
      clientSha: process.env.NEXT_PUBLIC_CLIENT_SHA ?? "dev",
    },
    {
      headers: {
        "Cache-Control":
          "public, max-age=0, s-maxage=30, stale-while-revalidate=30",
        "CDN-Cache-Control": "public, s-maxage=30",
      },
    },
  );
}
