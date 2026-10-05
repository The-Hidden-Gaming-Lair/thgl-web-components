# games-web

Multi-tenant Next.js container that serves **every** THGL public web
surface — game-specific sites, the marketing site at `www.th.gl`, and
the THGLApp WebView2 surface at `app.th.gl` — from a single Docker
image on Bunny Magic Containers.

The same container handles `palia.th.gl`, `avowed.th.gl`,
`www.th.gl`, `app.th.gl`, etc. It dispatches by inspecting the `Host`
header in middleware and resolving the right `AppConfig`.

## Tenants

| Tenant                   | Host                                                                                                                                                                                                                                                                                                         | Source on disk                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| games-web (per-game)     | `{slug}.th.gl` (palia, avowed, once-human, BPSR, homm-olden-era, diablo4, DNA, conan-exiles, crimson-desert, dune-awakening, grounded2, hogwarts-legacy, infinity-nikki, night-crows, palworld, pax-dei, rsdragonwilds, satisfactory, soulframe, soulmask, starsand-island, wuthering-waves, chrono-odyssey) | `app/g/[game]/[surface]/[locale]/…`        |
| THGLApp WebView2 surface | `app.th.gl`                                                                                                                                                                                                                                                                                                  | `app/(app)/(en)/…`, `app/(app)/[locale]/…` |
| Marketing site           | `www.th.gl` (apex `th.gl` 308-redirects here)                                                                                                                                                                                                                                                                | `app/www/…`                                |

Per-tenant configs live in `src/configs/{slug}.ts` and are registered
in `src/configs/index.ts`. `getAppConfigByHost(host)` keys on the
first subdomain (`palia.th.gl` → `palia`, `www.th.gl` → `www`, etc.).

## How routing works

1. `proxy.ts` reads the `Host` header → `getAppConfigByHost` →
   sets `x-thgl-app` request header downstream, and REWRITES game pages
   onto the internal route `/g/<game>/<surface>/<locale>/<path>`
   (`palia.th.gl/de/db/x` → `/g/palia/web/de/db/x`; Companion App copies
   use surface `app`, embedded maps `embed`). Public URLs never change;
   `/g/…` requested directly is a 404.
2. Server components / route handlers call `getAppConfig()` (or the
   stricter `requireApp("name")`) from `src/lib/get-app-config.ts`,
   which reads the `[game]` ROOT param (`next/root-params`, see
   `src/lib/route-params.ts`) inside the game tree, else the header.
3. Routes that should only serve one tenant guard with
   `await requireApp("thgl-app")` and `notFound()` other tenants.

Why the game is a route param and not only a header: `headers()` makes a
page dynamic, so before 2026-10 every game page re-rendered on every edge
miss. With the game in the route, pages can be cached by Next. `/db/*` is
(`force-static` + on-demand ISR, `cache-handler.cjs`: in-memory, size-capped,
re-rendered when the game's data version changes). A new top-level page
folder must be added to `src/lib/game-route-segments.json` (the proxy uses
the list to tell `/db/…` from `/de/…`; `next.config.js` fails the build if
they differ).

### Route groups

Each tenant tree has its own root layout to keep chrome / HTML body
classes isolated:

```
app/
  g/[game]/[surface]/[locale]/  ← games-web tenants (root layout), reached only via the proxy rewrite
  (app)/(en)/        ← thgl-app dashboard, en (root layout)
  (app)/[locale]/    ← thgl-app dashboard, localized (root layout)
  www/               ← thgl-web marketing site (root layout)
  api/               ← shared API routes (e.g. /api/revalidate)
  sitemap.xml/       ← multiTenant sitemap (dispatches by config)
  robots.ts          ← multiTenant robots (dispatches by config)
```

### Why `www/` and not `_www/`

Next.js silently excludes folders starting with `_` from routing
(private-folder convention). The migration originally used `_www/`,
hit no build errors, and produced zero `/www/*` routes. Renamed to
`www/` and middleware was updated to match. Don't reintroduce a `_`
prefix here.

### Collision-resolving middleware rewrites

Two tenants own URLs that would otherwise collide at the Next route
table (Next.js can't accept two `page.tsx` resolving to the same
path):

- thgl-web (`www.th.gl`) lives at `app/www/…` on disk. Middleware
  rewrites every `www.th.gl/*` request transparently to `/www/*`.
  Exempts paths already prefixed `/www/` (idempotent) or
  `/games/thgl-web/` (per-tenant static assets read by next/image
  filesystem reader, which bypasses middleware).
- Apex `th.gl` 308-redirects to `https://www.th.gl/…` (preserves path
  - query).

### Per-tenant static assets

Bundled under `public/games/{slug}/…`. Components reference them
either via:

- Middleware rewrites that we add for legacy URLs (e.g.
  `/THGL_Installer.exe` → `/games/thgl-app/THGL_Installer.exe` on
  app.th.gl), or
- Direct `<Image src="/games/{slug}/…">` references in code (because
  `next/image` reads `public/` from the filesystem and bypasses
  middleware).

## Local development

Modern browsers and OSes (RFC 6761) resolve `*.localhost` to loopback.
You don't need an `/etc/hosts` entry or anything else. Run the dev
server and open whichever tenant you want in a browser:

```bash
bun run dev
# → http://palia.localhost:3100/
# → http://avowed.localhost:3100/maps
# → http://app.localhost:3100/dashboard
# → http://www.localhost:3100/blog
```

The subdomain in the URL determines which tenant's config the
middleware resolves to. `localhost:3100` (no subdomain) doesn't match
any tenant and returns 404.

You can also test from the CLI by setting the Host header:

```bash
curl -H "Host: palia.th.gl" http://localhost:3100/
```

### Environment variables

Required for full functionality:

- `BUNNY_ACCOUNT_API_KEY` — Bunny purge API key (`/api/revalidate`).
- `PALIA_API_KEY`, `PALIA_REVALIDATE_SECRET` — palia leaderboard / rummage-pile / weekly-wants webhook.
- `PATREON_CLIENT_ID`, `PATREON_CLIENT_SECRET`, `PATREON_SPECIAL_USERS`, `JWT_SECRET`, `COOKIE_DOMAIN` — thgl-app + thgl-web Patreon OAuth flow. `redirect_uri` is derived from the incoming request host (each tenant round-trips to itself), so no per-host env var is needed; just ensure both `https://app.th.gl/api/patreon/redirect` and `https://www.th.gl/api/patreon/redirect` are in the Patreon OAuth app's redirect_uri allowlist.
- `NEXT_PUBLIC_BASE_URL` — base URL for server-side self-fetches.
- `BUNNY_DATABASE_URL`, `BUNNY_DATABASE_AUTH_TOKEN` — Patreon token store + shared filters (Bunny Database, libSQL).

Local dev uses `apps/games-web/.env.local` (gitignored). Production
container env vars are set in the Bunny Magic Container settings.

### Caching

`next.config.js` sets `Cache-Control: public, max-age=0, s-maxage=900,
stale-while-revalidate=3600` by default for pages — including RSC
responses (client navigations/prefetches). Two mechanisms keep HTML and
RSC cache entries distinct at the edge despite Bunny ignoring `Vary`:
Next appends a unique `?_rsc=<hash>` param to client navigations, and
the pull zone sets `CacheKeyHeaders=rsc` so the request header is part
of the Bunny cache key.

Short-TTL exceptions (60s): `/dashboard/*` and the palia-api-driven pages
(`/leaderboard`, `/rummage-pile`, `/weekly-wants`) whose localized variants
rely on expiry rather than the `/api/revalidate` purge.

The edge cache is SHARED by every visitor: the pull zone does not vary on
cookies (the `userId` cookie vary was removed 2026-10-05 — it gave each
signed-in user a private copy of every page, so supporters always hit the
origin). A response that depends on who is signed in must be `no-store`
(account/controller/redirect pages, `/api/patreon`, admin routes — see
`next.config.js`); per-user UI on a shared page renders client-side
(e.g. the status page's admin panel asks `/api/status/admin`).

## Adding a new tenant

1. Create `src/configs/{slug}.ts` exporting an `AppConfig`. Pick
   `domain` carefully — it's matched against the request's first
   subdomain.

2. Register it in `src/configs/index.ts`:

   ```ts
   import { yourGame } from "./your-game";
   const ALL_CONFIGS: AppConfig[] = [
     // existing entries…
     yourGame,
   ];
   ```

3. Configure DNS so `{slug}.th.gl` resolves to the games-web Bunny
   pull zone, and add the hostname under the pull zone's custom
   hostnames.

4. If the tenant needs custom routes that conflict with existing
   ones, follow the `www/` pattern: mount the routes under a
   reserved on-disk prefix and add a middleware rewrite for that
   tenant's host.

5. Per-tenant public assets go in `public/games/{slug}/…`. The
   middleware already rewrites a few well-known root paths
   (`/heatmaps/*`, `/opengraph-image.jpg`) to that prefix.

6. Push to `main` — `games-web-deploy.yml` builds the image and
   PATCHes the Magic Container template.

## Build & run as Docker

```bash
# from monorepo root
docker build -f apps/games-web/Dockerfile -t games-web .
docker run --rm -p 3100:3100 \
  -e PATREON_CLIENT_ID=… \
  -e JWT_SECRET=… \
  -e BUNNY_DATABASE_URL=… \
  -e BUNNY_DATABASE_AUTH_TOKEN=… \
  games-web
```

In production the image is built by GitHub Actions
(`games-web-deploy.yml`), pushed to GHCR, and the Bunny Magic
Container is PATCHed to use the new tag.

## Observability

- `src/instrumentation.ts` registers `onRequestError` so server-side
  errors are logged with their full stack (Next.js strips error
  messages from responses in prod, but the hook gets the raw error).
  Filters known cached-client noise (`Failed to find Server Action`,
  `Unexpected end of form`) so real bugs aren't drowned.
- The `[onRequestError]` line format is `digest=… routePath=…
routeType=… method=… path=… host=…` — search Bunny container logs
  for `[onRequestError]` to find anything we should care about.
- `/api/patreon/redirect` and the `getAccount` helper log tagged
  `[patreon/redirect]` and `[getAccount]` lines on each failure mode
  (missing env var, JWT verify failure, Bunny DB unreachable, Patreon
  API rejecting the token, etc.).
