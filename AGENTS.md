# Repository Guidelines

## Project Structure & Module Organization

- Monorepo managed by Turborepo.
- Apps: `apps/*` — Next.js web apps (`*-web`) and Overwolf apps (`*-overwolf`).
- Packages: `packages/*` — shared libraries (`@repo/lib`), UI (`@repo/ui`), and config presets (`@repo/*-config`, `@repo/jest-presets`).
- Assets live within each app (e.g., `apps/*/public`, `apps/*/store`).

## Build, Test, and Development Commands

- Install: `bun install` (Node >= 18; packageManager is Bun).
- Develop (all): `bun run dev`
- Develop (web apps): `bun run dev:web`
- Develop (Overwolf apps): `bun run dev:overwolf`
- Package-scoped dev: from the app dir, e.g.: `cd apps/wuthering-waves-web && bun run dev`
- Build all: `bun run build`
- Typecheck: `bun run typecheck` • Lint: `bun run lint` • Format: `bun run format`
- Test (workspace): `bun run test`
- Overwolf release example: `cd apps/once-human-overwolf && bun run release`

## Coding Style & Naming Conventions

- Language: TypeScript across apps/packages; React for UI.
- Formatting: Prettier (`bun run format`) — defaults (2-space, single quotes where applicable).
- Linting: ESLint via `@repo/eslint-config` (extends `eslint:recommended`, `prettier`, `eslint-config-turbo`).
- Naming: kebab-case for folders; apps suffixed with `-web` or `-overwolf`; tests `*.test.ts(x)`.

## Testing Guidelines

- Framework: Jest with `ts-jest`; presets under `packages/jest-presets` (browser/node).
- Place tests near source or under `__tests__/` using `*.test.ts(x)`.
- Run all tests: `bun run test`; per-package: `cd <pkg> && bun run test`.

## Commit & Pull Request Guidelines

- Commits: concise, imperative subject; scope with package/app when helpful (e.g., `ui:`, `wuthering-waves-web:`). Reference issues where relevant.
- PRs: clear description, scope, screenshots for UI changes, and linked issues. Ensure `bun run lint`, `bun run typecheck`, and `bun run build` pass.

## Security & Configuration Tips

- Ensure Bun is installed (`bun --version`).
- Environment vars: add only per-app as needed; do not commit secrets.
- Do not check in build artifacts (`dist`, `.next`, `node_modules`).
