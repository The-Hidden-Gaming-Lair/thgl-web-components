#!/usr/bin/env node
/**
 * CI-parity verification: typecheck + lint + unit tests across the whole monorepo.
 *
 * This is the single gate used by the pre-push git hook AND the CI "Verify"
 * workflow, so "passes locally" means "passes in CI". Build stays out of it on
 * purpose — Next.js/Vite builds already typecheck, and a full `turbo run build`
 * is too heavy (and OOMs) for a pre-push hook.
 *
 * `test` runs the jest suites (currently @repo/lib + @repo/ui; ~1s). They exist
 * because the My Filters sync regressions of 2026-09 were only caught after the
 * fact — running them by hand is not a gate, this is. The Playwright map smoke
 * suite (apps/games-web/e2e) is deliberately NOT here: it needs the running dev
 * servers, see `bun run test:e2e`.
 *
 * Concurrency is capped and the Node heap bumped because the monorepo OOMs when
 * turbo fans out ~12 `tsc` processes at once (observed on Windows dev machines).
 */
import { spawnSync } from "node:child_process";

const result = spawnSync("bunx turbo run typecheck lint test --concurrency=2", {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NODE_OPTIONS:
      `${process.env.NODE_OPTIONS ?? ""} --max-old-space-size=8192`.trim(),
  },
});

process.exit(result.status ?? 1);
