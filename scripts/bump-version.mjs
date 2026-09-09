#!/usr/bin/env node
// Dump or bump the meta.version of every Overwolf app manifest.
//
// Usage:
//   node scripts/bump-version.mjs                 # dump current versions
//   node scripts/bump-version.mjs major           # bump major for all apps  (X.0.0)
//   node scripts/bump-version.mjs minor           # bump minor for all apps  (X.Y.0)
//   node scripts/bump-version.mjs fix             # bump patch for all apps  (X.Y.Z+1)
//   node scripts/bump-version.mjs fix diablo4     # bump patch for one app only
//   node scripts/bump-version.mjs fix --skip-e2e  # bump without the smoke suite
//
// "patch" is accepted as an alias for "fix". Bumping follows semver: a major
// bump resets minor+patch to 0, a minor bump resets patch to 0.
//
// A bump is a release (the "Bump version" commit is what the preview workflows
// ship), so every bump first runs the interactive-map smoke suite
// (`bun run test:e2e`, apps/games-web/e2e) against the local dev servers and
// refuses to touch a manifest if it fails. That suite is the only check that
// sees the WebGL map / live-marker lifecycle regressions; without this gate it
// is a rule in a doc that gets skipped at midnight. `--skip-e2e` is the
// escape hatch for a release that must go out while the dev servers are down.

import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APPS_DIR = join(ROOT, "apps");
const BUMP_TYPES = { major: 0, minor: 1, fix: 2, patch: 2 };
const E2E_HOST = "http://palia-dev.localhost:3100/";

function usage() {
  console.log(
    [
      "Dump or bump the version in the Overwolf app manifests.",
      "",
      "Usage:",
      "  node scripts/bump-version.mjs                 dump current versions",
      "  node scripts/bump-version.mjs <major|minor|fix> [app] [--skip-e2e]",
      "                                                bump (all apps, or one)",
      "",
      "'patch' is an alias for 'fix'. Major/minor bumps reset lower parts to 0.",
      "A bump runs the map smoke suite (bun run test:e2e) first and aborts on",
      "failure; --skip-e2e bypasses it (dev servers down, emergency release).",
    ].join("\n"),
  );
}

// Find every apps/*-overwolf/manifest.json
function findManifests() {
  return readdirSync(APPS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.endsWith("-overwolf"))
    .map((d) => ({
      app: d.name,
      path: join(APPS_DIR, d.name, "manifest.json"),
    }))
    .filter((m) => {
      try {
        readFileSync(m.path);
        return true;
      } catch {
        return false;
      }
    })
    .sort((a, b) => a.app.localeCompare(b.app));
}

function readVersion(path) {
  return JSON.parse(readFileSync(path, "utf8"))?.meta?.version;
}

function bump(version, type) {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n))) {
    throw new Error(`Unexpected version "${version}" (expected X.Y.Z)`);
  }
  const i = BUMP_TYPES[type];
  parts[i] += 1;
  for (let j = i + 1; j < parts.length; j++) parts[j] = 0;
  return parts.join(".");
}

// Replace meta.version in place, preserving the file's exact formatting and
// line endings (a targeted string swap rather than re-serializing the JSON).
function writeVersion(path, oldVersion, newVersion) {
  const text = readFileSync(path, "utf8");
  const needle = `"version": "${oldVersion}"`;
  const count = text.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(
      `Expected exactly one '${needle}' in ${path}, found ${count}`,
    );
  }
  writeFileSync(path, text.replace(needle, `"version": "${newVersion}"`));
}

/**
 * Run the map smoke suite; returns true when the bump may proceed. A dev
 * server that is not up is reported as such instead of as 6 timeouts.
 */
async function smokeSuitePasses() {
  try {
    const res = await fetch(E2E_HOST, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.error(
      `Dev server not reachable at ${E2E_HOST} (${err?.message ?? err}).\n` +
        "Start it (`bun run dev`, plus data-forge on :33033) and retry, or " +
        "pass --skip-e2e to bump without the smoke suite.",
    );
    return false;
  }
  console.log("Running the interactive-map smoke suite before bumping…");
  const result = spawnSync("bun run test:e2e", {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    console.error(
      "\nSmoke suite failed — nothing was bumped. Fix the regression (or pass " +
        "--skip-e2e if you really must ship).",
    );
    return false;
  }
  return true;
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("-h") || argv.includes("--help")) {
    usage();
    return;
  }
  const skipE2e = argv.includes("--skip-e2e");
  const args = argv.filter((a) => !a.startsWith("--"));

  const [type, appFilter] = args;
  if (type !== undefined && !(type in BUMP_TYPES)) {
    console.error(`Unknown bump type "${type}". Use major, minor, or fix.\n`);
    usage();
    process.exitCode = 1;
    return;
  }

  let manifests = findManifests();
  if (appFilter) {
    const want = appFilter.endsWith("-overwolf")
      ? appFilter
      : `${appFilter}-overwolf`;
    manifests = manifests.filter((m) => m.app === want);
    if (manifests.length === 0) {
      console.error(`No Overwolf app matching "${appFilter}".`);
      process.exitCode = 1;
      return;
    }
  }

  const pad = Math.max(...manifests.map((m) => m.app.length));

  // Dump mode
  if (!type) {
    for (const { app, path } of manifests) {
      console.log(`${app.padEnd(pad)}  ${readVersion(path)}`);
    }
    return;
  }

  // Bump mode
  if (skipE2e) {
    console.warn("--skip-e2e: bumping WITHOUT running the map smoke suite.");
  } else if (!(await smokeSuitePasses())) {
    process.exitCode = 1;
    return;
  }
  for (const { app, path } of manifests) {
    const oldVersion = readVersion(path);
    const newVersion = bump(oldVersion, type);
    writeVersion(path, oldVersion, newVersion);
    console.log(`${app.padEnd(pad)}  ${oldVersion} -> ${newVersion}`);
  }
}

await main();
