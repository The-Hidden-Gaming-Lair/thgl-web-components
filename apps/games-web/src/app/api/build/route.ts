// Reports which build the LIVE container is running (git SHA baked in via the
// Docker build-arg GIT_SHA → NEXT_PUBLIC_BUILD_SHA). Two consumers:
//
//  1. NewVersionWatcher (client): polls this to offer a click-to-reload toast
//     when the deployed build no longer matches the one the tab is running.
//  2. games-web-deploy.yml: probes this (with a cache-busting query) to detect
//     when the old container instance has fully drained before purging pages.
//
// Must NEVER be cached: next.config.js pins /api/build to no-store (the
// generic /:path* pageCache rule would otherwise give it s-maxage=86400),
// and we set the same header here for defense in depth.
export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json(
    { sha: process.env.NEXT_PUBLIC_BUILD_SHA ?? "dev" },
    {
      headers: {
        "Cache-Control": "no-store",
        "CDN-Cache-Control": "no-store",
      },
    },
  );
}
