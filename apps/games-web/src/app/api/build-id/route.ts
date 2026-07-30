// Reports which build the LIVE container is running (git SHA baked in via the
// Docker build-arg GIT_SHA → NEXT_PUBLIC_BUILD_SHA). Two consumers:
//
//  1. NewVersionWatcher (client): polls this to offer a click-to-reload toast
//     when the deployed build no longer matches the one the tab is running.
//  2. games-web-deploy.yml: probes this (with a cache-busting query) to detect
//     when the old container instance has fully drained before purging pages.
//
// Must NEVER be cached: next.config.js pins /api/build-id to no-store (the
// generic /:path* pageCache rule would otherwise give it s-maxage=86400),
// and we set the same header here for defense in depth.
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
        "Cache-Control": "no-store",
        "CDN-Cache-Control": "no-store",
      },
    },
  );
}
