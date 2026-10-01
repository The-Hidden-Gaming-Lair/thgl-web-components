#!/usr/bin/env node
/**
 * Guard: every Overwolf app ships the native plugins its manifest loads, and its
 * background script talks to the plugin API that DLL actually exposes.
 *
 *   node scripts/check-overwolf-plugins.mjs              # all apps/*-overwolf
 *   node scripts/check-overwolf-plugins.mjs satisfactory # one app
 *
 * Why (2026-10-01): an all-apps "Bump version" commit swept up another session's
 * uncommitted satisfactory manifest edit (game-events -> THGLOverwolfPlugin.dll) while
 * the DLL itself was still untracked and background.tsx still used the legacy API.
 * Satisfactory 1.22.1 shipped to 100% of users with a plugin that wasn't in the
 * package, so live mode was dead. This check fails that state:
 *   1. every manifest `data.extra-objects[*].file` exists in the app folder AND is
 *      tracked by git (CI checkouts only contain tracked files, so "exists locally"
 *      is not enough);
 *   2. the game-events plugin and background.tsx agree: a `THGL.Overwolf.*` class
 *      (unified plugin, pushes messages) needs `initTHGLPlugin`; any other class
 *      (legacy GameEventsPlugin, polled) must NOT use it.
 *
 * Runs in scripts/verify.mjs (pre-push hook + CI Verify), in every *-preview.yml
 * before the release build, and in scripts/bump-version.mjs before bumping.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APPS_DIR = join(ROOT, "apps");

function isTracked(relPath) {
  const r = spawnSync("git", ["ls-files", "--error-unmatch", relPath], {
    cwd: ROOT,
    stdio: "ignore",
  });
  // No git (e.g. a tarball build): existence is all we can check.
  if (r.error) return true;
  return r.status === 0;
}

/** Problems for one app ("palia-overwolf"); empty = OK. */
export function checkApp(app) {
  const problems = [];
  const appDir = join(APPS_DIR, app);
  const manifest = JSON.parse(
    readFileSync(join(appDir, "manifest.json"), "utf8"),
  );
  const objects = manifest?.data?.["extra-objects"] ?? {};
  for (const [name, obj] of Object.entries(objects)) {
    const rel = `apps/${app}/${obj.file}`;
    if (!existsSync(join(appDir, obj.file))) {
      problems.push(
        `${app}: extra-object "${name}" loads ${obj.file}, which does not exist`,
      );
    } else if (!isTracked(rel)) {
      problems.push(
        `${app}: extra-object "${name}" loads ${obj.file}, which is not committed (git add ${rel})`,
      );
    }
  }

  const gameEvents = objects["game-events"];
  const backgroundPath = join(appDir, "src", "background.tsx");
  if (gameEvents && existsSync(backgroundPath)) {
    const background = readFileSync(backgroundPath, "utf8");
    const usesUnified = /\binitTHGLPlugin\s*\(/.test(background);
    const isUnified = String(gameEvents.class).startsWith("THGL.Overwolf.");
    if (isUnified && !usesUnified) {
      problems.push(
        `${app}: manifest loads the unified plugin (${gameEvents.class}) but src/background.tsx does not call initTHGLPlugin`,
      );
    } else if (!isUnified && usesUnified) {
      problems.push(
        `${app}: src/background.tsx calls initTHGLPlugin but the manifest loads ${gameEvents.class} from ${gameEvents.file}`,
      );
    }
  }
  return problems;
}

export function overwolfApps() {
  return readdirSync(APPS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.endsWith("-overwolf"))
    .filter((d) => existsSync(join(APPS_DIR, d.name, "manifest.json")))
    .map((d) => d.name)
    .sort();
}

const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const filter = process.argv[2];
  const apps = filter
    ? [filter.endsWith("-overwolf") ? filter : `${filter}-overwolf`]
    : overwolfApps();
  const problems = apps.flatMap(checkApp);
  if (problems.length) {
    console.error("Overwolf plugin check FAILED:\n  " + problems.join("\n  "));
    process.exit(1);
  }
  console.log(`Overwolf plugin check OK (${apps.join(", ")})`);
}
