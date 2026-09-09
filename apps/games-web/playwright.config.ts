import { defineConfig, devices } from "@playwright/test";

/**
 * Interactive-map smoke suite. Runs against the ALREADY-RUNNING dev servers
 * (games-web on :3100 + data-forge on :33033) — it never starts one, so a
 * failure means the page broke, not that the harness could not boot.
 *
 * Why this exists: the map/live-marker regressions of 2026-08/09 (sprite
 * padding lost on update, zoom reset on map switch, stale region borders,
 * late-loaded sprites) were all React-effect lifecycle bugs around WebGL
 * layers. Unit tests cannot see those; only driving the real page can. Kept
 * out of `bun run verify` on purpose (needs the dev servers, ~1 min).
 *
 *   bun run test:e2e            # from the repo root or apps/games-web
 *   E2E_GAME=palia bun run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e-report" }]],
  outputDir: "e2e-results",
  use: {
    ...devices["Desktop Chrome"],
    viewport: { width: 1400, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Headless Chromium has no GPU; SwiftShader gives the WebMap a real
    // WebGL context so tiles + markers actually draw (black-canvas checks
    // below rely on it).
    launchOptions: {
      args: [
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
      ],
    },
  },
});
