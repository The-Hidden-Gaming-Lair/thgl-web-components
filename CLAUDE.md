# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Key Commands

### Development

- **Run games-web** (every public web tenant): `bun run dev --filter=games-web` — open
  `http://palia.localhost:3100/`, `http://www.localhost:3100/`, `http://app.localhost:3100/dashboard`
  etc. in a browser to test as a specific tenant. `*.localhost` resolves to loopback per
  RFC 6761; no `/etc/hosts` entry needed.
- **Run an Overwolf app**: `bun run dev:overwolf` or `bun run dev:{game}` (e.g.
  `dev:palworld` targets `palworld-overwolf`).
- **Local data-forge**: open `http://palia-dev.localhost:3100/` (any tenant +
  `-dev` suffix) to serve that tenant against a local data-forge dev server
  on `localhost:33033` instead of prod — per tab, no restart; plain
  `palia.localhost:3100` keeps using prod data. Works via a dev-only
  same-origin proxy (see `FORGE_DEV_PROXY` in `packages/lib/src/config.ts`
  and `apps/games-web/src/proxy.ts`). For Overwolf apps (no host to vary),
  override `NEXT_PUBLIC_DATA_FORGE_URL` / `NEXT_PUBLIC_DATA_FORGE_CDN_URL` /
  `NEXT_PUBLIC_TH_GL_URL` / `NEXT_PUBLIC_API_FORGE_URL` in the environment
  instead (wired into Vite via `@repo/lib/vite-define`).
- **CLI host override**: `curl -H "Host: palia.th.gl" http://localhost:3100/`.

### Build & Quality

- **⚠️ Before finishing any change, run `bun run verify`** — typecheck + lint
  across the monorepo (CI-parity; this is what GitHub Actions enforces). It is
  concurrency-capped + heap-bumped so it does NOT OOM the way a raw
  `turbo run typecheck lint` does (~12 parallel `tsc` exhausts memory). Treat a
  clean `bun run verify` as the bar for "done".
- **Build**: `bun run build` or `turbo run build`
- **Typecheck**: `bun run typecheck`
- **Lint**: `bun run lint`
- **Clean**: `bun run clean`
- **Update dependencies**: `bun run update-deps`
- **Git hooks** (auto-installed via `prepare` → `core.hooksPath=.githooks`):
  `pre-commit` formats staged files with Prettier; `pre-push` runs
  `bun run verify`. Bypass in a pinch with `--no-verify`.
- **Before committing, confirm `git branch --show-current`** — the checkout is shared
  across parallel Claude sessions; another session may have switched to a WIP branch
  between your turns (a 2026-07-27 commit landed on a stray branch this way).

### Testing

No test framework is configured - the project relies on TypeScript, linting, and formatting for code quality.

## Architecture Overview

This is a TurboRepo monorepo for The Hidden Gaming Lair, containing one
multi-tenant Next.js container that serves every public web surface plus
nine game-specific Overwolf overlay apps.

### Project Structure

- **`apps/games-web/`** — multi-tenant Next.js container. One Docker
  image, deployed on Bunny Magic Containers, serves every game site
  (`palia.th.gl`, `avowed.th.gl`, `oncehuman.th.gl`, etc.), the THGLApp
  WebView2 surface (`app.th.gl`), and the marketing site (`www.th.gl`).
  Middleware dispatches by `Host` header → per-tenant `AppConfig` in
  `src/configs/{slug}.ts`. See `apps/games-web/README.md` for the full
  routing model.
- **`apps/{game}-overwolf/`** — Vite-based Overwolf overlay per game.
  Each ships independently (Overwolf store distribution requires its
  own .opk per game).

- **Shared Packages** (`packages/`):
  - `@repo/lib`: Core logic, types, utilities, game configurations
  - `@repo/ui`: Shared React components using Radix UI + Tailwind
    - Component folders organized by usage context (see UI Package Structure below)
  - Config packages: `config-eslint`, `config-typescript`, `config-tailwind`

### Key Configuration Files

- `apps/games-web/src/configs/{slug}.ts` — per-tenant `AppConfig`
  (registered in `src/configs/index.ts`). Driven by the request's
  first hostname subdomain.
- `apps/{game}-overwolf/src/config.ts` — per-Overwolf-app config.
- Game definitions live in `packages/lib/src/games.ts`.

#### Single source of truth for game config

`packages/lib/src/games.ts` (`games: Game[]`) is **canonical**. The per-surface
configs only carry surface-specific fields plus a `name` that links back to
`Game.id`; the shared fields — `title`, `domain`, `markerOptions` — are **not
re-declared** there. They are derived from the linked `Game` by resolvers in
`@repo/lib`:

- Web config: `export const x = resolveAppConfig({ name: "<game-id>", ... })`
  (omit `title`/`domain`/`markerOptions` — they come from the `Game`).
- Overwolf config: `export const APP_CONFIG = resolveOverwolfConfig({ name, gameClassId, appId, appUrl, discordApplicationId })`.
  Overwolf store identifiers (`appId`/`appUrl`) stay in the overwolf config and
  are **never** hoisted to the public `Game` registry (some are private apps).
- `domain` is derived from the `Game.web` subdomain via `getAppDomain`;
  `markerOptions` via `getGameMarkerOptions` (top-level `Game.markerOptions`,
  falling back to `companion.markerOptions`). Helpers + resolvers + the strict
  output types (`AppConfig`/`OverwolfAppConfig`) and authoring input types
  (`AppConfigInput`/`OverwolfAppConfigInput`) all live in `packages/lib/src/config.ts`.
- Configs with **no** `Game` entry (e.g. `thgl-web`, `thgl-app`, in-development
  games) must supply their own `title`/`domain` in the config.

### Technology Stack

- **Runtime**: Bun (package manager and runtime)
- **Frameworks**: Next.js (games-web container), Vite (Overwolf apps)
- **UI**: React + TypeScript + Tailwind CSS + Radix UI
- **State**: Zustand
- **Maps**: Custom WebGL2 engine for interactive game maps

### Development Notes

- All paths must be absolute, not relative
- Follow existing code patterns and conventions in the codebase
- `games-web` auto-deploys to Bunny via GitHub Actions (`games-web-deploy.yml`).
  Overwolf apps require manual updates.
- No direct pushes to main - all changes via PR
- Use `.env.example` files for environment variable templates (never commit `.env` files)
- Repository is source-available but NOT open source - code cannot be reused for other projects
- Format code with Prettier, ensure ESLint passes before committing

### Component Patterns

The codebase uses reusable components to maintain consistency and reduce duplication:

#### Page Structure Components

- **PageShell**: Wrapper for page content with consistent spacing and max-width
- **PageHeader**: Standardized page headers with title and description
- **ViewMoreLink**: Consistent "view all" links with arrow icons

#### Content Components

- **InfoCard**: General-purpose card for links with optional badges, icons, and descriptions
  - Used by: PartnerCard, PlatformCard
  - Supports: external links, custom badge variants, h2/h3 title sizes
- **BenefitList**: Icon + description lists with configurable styling
  - Supports: emoji strings or Lucide icons, optional labels, size/spacing variants
  - Used in: partner-program, advertise pages

#### Best Practices

- Check for existing reusable components before creating new ones
- Look for repeated patterns (3+ occurrences) that could be extracted into components
- Prefer composition over duplication
- Keep components flexible with optional props and sensible defaults

### UI Package Structure

The `@repo/ui` package is organized into component folders by usage context to optimize tree-shaking and prevent circular dependencies:

#### Component Folder Organization

- **(overwolf)**: Overwolf-exclusive components (ads, app shell, hotkeys, resize borders)
  - Only used by `{game-name}-overwolf` apps
  - Import via `@repo/ui/overwolf`
- **(desktop)**: Shared desktop components used by both Overwolf apps and thgl-app
  - Components: StreamingSender, MapContainer, QR
  - Import via `@repo/ui/desktop`
- **(thgl-app)**: thgl-app-specific components (companion app for Windows)
  - Import via `@repo/ui/thgl-app`
- **(apps)**: Shared app-level components (RootLayout, MapPage, etc.)
  - Used by web and desktop apps
  - Import via `@repo/ui/apps`
- **(controls)**: UI controls and dialogs (Actions, Toaster, Settings, etc.)
  - Import via `@repo/ui/controls`
  - Note: MarkersSearch exported separately via `@repo/ui/markers-search`
- **(interactive-map)**: Map components (InteractiveMap, Markers, LivePlayer, etc.)
  - Import via `@repo/ui/interactive-map`
- **(header)**: Header components (Header, Brand, Account, PlausibleTracker)
  - Import via `@repo/ui/header`
- **(providers)**: Context providers (I18NProvider, TooltipProvider, CoordinatesProvider)
  - Import via `@repo/ui/providers`
- **(content)**: Content display components (markdown, discord messages, etc.)
  - Import via `@repo/ui/content`
- **(data)**: Data display components (spawns lists, map guides, progress tracking)
  - Import via `@repo/ui/data`
- **(peer)**: P2P collaboration components (Whiteboard)
  - Import via `@repo/ui/peer`
- **(ads)**: Ad components for web apps
  - Import via `@repo/ui/ads`

#### Tree-Shaking Best Practices

- **Barrel files use named exports only** - No wildcard `export *` to enable proper tree-shaking
- **Avoid circular dependencies** - Within `packages/ui`, use direct relative imports (e.g., `../ui/button`) instead of `@repo/ui/*` imports
- **Break dependency chains** - Components should not import from unrelated feature folders
- **Client components** - "use client" components in barrel files can prevent tree-shaking in Next.js; isolated exports help (e.g., `@repo/ui/markers-search`)
- **Package.json exports** - All component folders are explicitly exported in package.json for controlled access

## Overwolf Log Analysis

When asked to analyze Overwolf log files, refer to `.claude/overwolf-logs-analysis.md` for detailed instructions.

**Log Location**: `%LOCALAPPDATA%\Overwolf\Log`

**Quick Reference - Log Types**:
| Log File | Pattern | Purpose |
|----------|---------|---------|
| Trace | `Trace_*.log` | Platform actions, system state, errors |
| Game HTML | `<GameName>_*.Game.html` | Game integration, DLL injection, overlay rendering |
| OBS | OBS logs | Recording engine, encoder, audio/video devices |
| OverwolfPerf | OverwolfPerf logs | CPU/memory usage per process |
| DxDiag | DxDiag.txt | System hardware, drivers, DirectX info |

**Analysis Priority**:

1. Start with **Trace logs** - search for `ERROR` and `WARN` entries
2. Check **Game HTML logs** - for overlay/rendering issues
3. Review **OverwolfPerf** - for performance complaints
4. Check **DxDiag** - for hardware/driver compatibility

## Hotkey System

Hotkeys for desktop apps (Overwolf and THGL Companion App) require updates in multiple locations:

### Adding a New Hotkey

1. **Overwolf Apps** - Update ALL `manifest.json` files in `apps/*-overwolf/`:

   ```json
   "hotkeys": {
     "hotkey_name": {
       "title": "Human Readable Title",
       "action-type": "custom",
       "default": "Shift+F5"
     }
   }
   ```

2. **THGL App & Settings Store** - Update `packages/lib/src/settings.ts`:

   ```typescript
   // In DEFAULT_PROFILE_SETTINGS.hotkeys:
   hotkeys: {
     toggle_app: "F6",
     zoom_in_app: "F7",
     zoom_out_app: "F8",
     toggle_lock_app: "F9",
     discover_node: "F10",
     toggle_live_mode: "F5",
     toggle_overlay_fullscreen: "Shift+F9",
     show_labels: "Shift+F5",
   },
   ```

3. **Hotkey Handler** - Implement in `packages/ui/src/components/(overwolf)/map-hotkeys.tsx` or equivalent

### Overwolf Manifest Files

All 9 Overwolf apps need identical hotkey configurations:

- `apps/avowed-overwolf/manifest.json`
- `apps/diablo4-overwolf/manifest.json`
- `apps/hogwarts-legacy-overwolf/manifest.json`
- `apps/once-human-overwolf/manifest.json`
- `apps/palia-overwolf/manifest.json`
- `apps/palworld-overwolf/manifest.json`
- `apps/pax-dei-overwolf/manifest.json`
- `apps/satisfactory-overwolf/manifest.json`
- `apps/wuthering-waves-overwolf/manifest.json`

## Preview Access Features

Some features are gated behind Preview Release access for Elite Supporters.

### Implementation Pattern

```typescript
// In component:
const hasPreviewAccess = useAccountStore(
  (state) => state.perks.previewReleaseAccess,
);

// Conditionally render or enable feature:
if (hasPreviewAccess) {
  // Show preview feature
}
```

### Current Preview Features

- Marker Labels (label mode per filter, text size, hotkey toggle)

### Graduating Features to Public

When a preview feature is ready for all users:

1. Remove `hasPreviewAccess` checks from the code
2. Update release notes to announce public availability
3. Add new preview feature to maintain supporter value

## Per-Filter Settings Pattern

The filter settings popover (`packages/ui/src/components/(controls)/filter-settings-popover.tsx`) provides per-filter configuration.

### Current Per-Filter Settings

- **Icon Size**: `iconSizeByFilter` in settings store
- **Audio Alert**: `audioAlertByFilter` in settings store
- **Label Mode**: `labelModeByFilter` in settings store (preview access)

### Adding a New Per-Filter Setting

1. **Settings Store** (`packages/lib/src/settings.ts`):

   ```typescript
   // Add to ProfileSettings type:
   newSettingByFilter: Record<string, ValueType>;

   // Add to DEFAULT_PROFILE_SETTINGS:
   newSettingByFilter: {},

   // Add action:
   setNewSettingByFilter: (filterId: string, value: ValueType) => void;
   ```

2. **Filter Settings Popover** - Add UI control in the popover

3. **Markers Component** - Read setting and apply to markers

### Group Settings

Some settings support group-level control (all filters in a group):

- Use `setNewSettingByFilters(filterIds[], value)` for batch updates
- Check for "mixed" state when group has different values per filter

## Performance Optimization Patterns

For maps with thousands of markers and real-time updates:

### Spatial Grid for Proximity Queries

Located in `packages/ui/src/components/(interactive-map)/spatial-grid.ts`

```typescript
// O(k) queries instead of O(n) iteration
const spatialGrid = new SpatialGrid<CanvasMarker>(cellSize);
spatialGrid.add(marker, x, y);
spatialGrid.getNearby(playerX, playerY, maxDistance);
```

Use when: Checking proximity for many markers (audio alerts, z-position, labels)

### Canvas Caching

Located in `packages/ui/src/components/(interactive-map)/canvas-marker.ts`

- Cache rendered marker canvases by unique key
- Clear cache on zoom change (`clearCanvasCache()`)
- Include all visual properties in cache key (icon, size, color, colorBlind settings)

### Consolidated Loops

Instead of multiple O(n) passes over markers:

```typescript
// BAD: 3 separate loops
markers.forEach(checkZPosition);
markers.forEach(checkAudioAlert);
markers.forEach(updateLabels);

// GOOD: Single consolidated loop
for (const marker of markers) {
  // Check z-position
  // Check audio alert
  // Update labels
}
```

### Memoization

```typescript
// Memoize expensive calculations
const rotatedPlayer = useMemo(() => {
  if (!player || !rotationCache) return null;
  const rotated = rotationCache.getRotated(player.x, player.y);
  return { x: rotated[0], y: rotated[1], z: player.z };
}, [player, rotationCache]);
```

### Batched Pixel Operations

When manipulating canvas pixels:

```typescript
// BAD: Multiple getImageData/putImageData cycles
applyFillColor(context); // getImageData + putImageData
applyColorBlind(context); // getImageData + putImageData

// GOOD: Single cycle for all transforms
const imageData = context.getImageData(0, 0, width, height);
applyFillColorToData(imageData.data);
applyColorBlindToData(imageData.data);
context.putImageData(imageData, 0, 0);
```

## Release Workflow

### Code Changes

1. Implement feature/fix
2. Run `bun run typecheck` to verify
3. Commit with descriptive message
4. Create PR for review (no direct pushes to main)

### Announcements

After merging:

1. **Discord** (`#app-updates` channel):
   - Use bold headers, no emojis
   - Include role mentions for relevant games
   - Add support links and app links at top
   - Attach screenshots if applicable

2. **Patreon** (for significant updates):
   - Similar format to Discord but more personal tone
   - Start with "Hey everyone!"
   - End with "— DevLeon"
   - Highlight supporter-exclusive features

### Announcement Template (Discord)

```
_To get pinged for future updates, claim the @{Game} role in <id:customize>_

You can [support me](https://www.th.gl/support-me) (no more ads) and by sharing this project on social media.
[{game}.th.gl](https://{game}.th.gl)
[THGL Companion App](https://www.th.gl/companion-app)

**Feature Title**

Description of the feature...

How it works
- Step 1
- Step 2

**Bug Fixes**
- Fix description
```
