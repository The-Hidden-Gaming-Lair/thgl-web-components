// bun test apps/games-web/scripts/db-index-routes.test.ts
/**
 * Every type of a tenant's database index must resolve to a /db route (inbox #915).
 * #908: Albion's vanity / misc / abilities were in database.index.json with no
 * `db.homeSections` entry, so their section pages were 404s. The check keys on
 * the data-forge output (public/<game>/config/database.index.json, or the
 * monolith database.json fetchDatabaseIndex falls back to), not on typeLabels:
 * a type resolves via a homeSections `type` / `extraTypes` / `typePrefix`, or a
 * bespoke per-game type map (HoMM's TYPE_SECTION), and that segment must be a
 * homeSections route or a static route folder under app/g/.../db.
 * `_`-prefixed types (`_resources`) are lookup data, not sections. Tenants
 * without `db` have no /db pages and are skipped.
 *
 * Reads the sibling data-forge checkout; skipped where it is missing (CI).
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { getRegisteredApps } from "../src/configs";
import { TYPE_SECTION as HOMM_TYPE_SECTION } from "../src/games/homm-olden-era/sections";

const dataForgePublic = join(
  import.meta.dir,
  "..",
  "..",
  "..",
  "..",
  "data-forge",
  "public",
);
const dbRouteDir = join(
  import.meta.dir,
  "..",
  "src",
  "app",
  "g",
  "[game]",
  "[surface]",
  "[locale]",
  "db",
);

/** Bespoke per-game type → /db segment maps (static route folders, not homeSections). */
const BESPOKE_TYPE_SECTIONS: Record<string, Record<string, string>> = {
  "homm-olden-era": HOMM_TYPE_SECTION,
};

const staticRoutes = new Set(
  readdirSync(dbRouteDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("["))
    .map((d) => d.name),
);

function readIndexTypes(appName: string): string[] | null {
  const dir = join(dataForgePublic, appName, "config");
  for (const file of ["database.index.json", "database.json"]) {
    const path = join(dir, file);
    if (existsSync(path)) {
      const db: Array<{ type: string }> = JSON.parse(
        readFileSync(path, "utf8"),
      );
      return db.map((c) => c.type);
    }
  }
  return null;
}

const tenants = getRegisteredApps().flatMap((app) => {
  if (!app.db) return [];
  const types = readIndexTypes(app.name);
  return types ? [{ app, db: app.db, types }] : [];
});

describe.skipIf(!existsSync(dataForgePublic))(
  "database index types resolve to a /db route",
  () => {
    test("data-forge has database indexes for the db tenants", () => {
      expect(tenants.length).toBeGreaterThan(0);
    });

    for (const { app, db, types } of tenants) {
      test(app.name, () => {
        const sectionSegments = new Set(
          db.homeSections.flatMap((s) => [
            s.href.replace(/^\/db\//, "").replace(/\/.*$/, ""),
            s.type,
          ]),
        );
        const bespoke = BESPOKE_TYPE_SECTIONS[app.name] ?? {};
        const unresolved: string[] = [];
        for (const type of types) {
          if (type.startsWith("_")) continue;
          const section = db.homeSections.find(
            (s) =>
              s.type === type ||
              (s.extraTypes ?? []).includes(type) ||
              (s.typePrefix ? type.startsWith(s.typePrefix) : false),
          );
          if (section) continue;
          const segment = bespoke[type];
          if (
            segment &&
            (sectionSegments.has(segment) || staticRoutes.has(segment))
          )
            continue;
          unresolved.push(
            segment ? `${type} -> /db/${segment} (no such route)` : type,
          );
        }
        expect(
          unresolved,
          `${app.name}: database index types without a /db route (add a db.homeSections entry)`,
        ).toEqual([]);
      });
    }
  },
);
