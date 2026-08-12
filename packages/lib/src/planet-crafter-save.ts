/**
 * Parse a The Planet Crafter save file (client-side, for the web "upload your save"
 * feature) into the render inputs the map needs.
 *
 * Terraforming is a single DETERMINISTIC progression (identical for every player) that
 * changes the map LOOK (sky/terrain colour + water level + ice-melt access) in a few
 * discrete stages; each save also carries the player's own diffs (built machines, etc.).
 * The pristine deposits + terrain are deterministic, so:
 *   base map + terraform stage (from `terraform`) + placed-object diff (from `placed`)
 *   = a player's accurate map, no game needed.
 *
 * Save format (JSONExport.SaveToJson): UTF-8-BOM; sections separated by `\n@\n`; each
 * section is a `|`-separated list of JSON objects. Sections are identified by CONTENT
 * (not a fixed index) so this survives save-format tweaks. Mirrors the Python reference
 * at data-forge `data-mining/src/planet-crafter/save_parser.py`.
 */

export interface PlanetTerraform {
  planetId: string | null;
  units: {
    unitOxygenLevel: number;
    unitHeatLevel: number;
    unitPressureLevel: number;
    unitPlantsLevel: number;
    unitInsectsLevel: number;
    unitAnimalsLevel: number;
  };
  /** sum of positive units — monotonic, orders the terraform stage */
  total: number;
}

export interface PlacedObject {
  id: number | null;
  gId: string | null;
  /** world position [x, y, z] */
  pos: [number, number, number] | null;
}

export interface ParsedSave {
  saveName: string | null;
  planetId: string | null;
  worldSeed: number | null;
  version: string | null;
  mode: string | null;
  randomizeMineables: boolean | null;
  terraform: PlanetTerraform[];
  counts: { worldObjects: number; placed: number; inventory: number };
  /** placed-object counts by gId, descending */
  placedByGId: Record<string, number>;
  placed: PlacedObject[];
}

function* objectsIn(section: string): Generator<Record<string, unknown>> {
  for (const raw of section.split("|")) {
    const part = raw.trim().replace(/^﻿/, "");
    if (!part) continue;
    try {
      yield JSON.parse(part) as Record<string, unknown>;
    } catch {
      // trailing / partial fragment — skip
    }
  }
}

const num = (v: unknown): number =>
  typeof v === "number" ? v : Number(v) || 0;

/** Parse the raw save-file text into structured render inputs. */
export function parsePlanetCrafterSave(text: string): ParsedSave {
  // strip BOM + normalise CRLF/CR → LF (save files are Windows-authored; the section
  // separator is `\n@\n`, which won't match against `\r\n@\r\n`).
  const sections = text
    .replace(/^﻿/, "")
    .replace(/\r\n?/g, "\n")
    .split("\n@\n");

  const planets: Record<string, unknown>[] = [];
  const worldObjects: Record<string, unknown>[] = [];
  let gameState: Record<string, unknown> = {};

  for (const sec of sections) {
    for (const o of objectsIn(sec)) {
      if ("unitOxygenLevel" in o) planets.push(o);
      else if ("gId" in o) worldObjects.push(o);
      else if ("saveDisplayName" in o || "worldSeed" in o) gameState = o;
    }
  }

  const terraform: PlanetTerraform[] = planets.map((p) => {
    const units = {
      unitOxygenLevel: num(p.unitOxygenLevel),
      unitHeatLevel: num(p.unitHeatLevel),
      unitPressureLevel: num(p.unitPressureLevel),
      unitPlantsLevel: num(p.unitPlantsLevel),
      unitInsectsLevel: num(p.unitInsectsLevel),
      unitAnimalsLevel: num(p.unitAnimalsLevel),
    };
    const total = Object.values(units).reduce((s, v) => (v > 0 ? s + v : s), 0);
    return { planetId: (p.planetId as string) ?? null, units, total };
  });

  // placed = worldObjects carrying a world position (built machines / drills /
  // teleporters / containers / placed deposits). Objects without `pos` are inventory.
  const placed: PlacedObject[] = [];
  for (const o of worldObjects) {
    const pos = o.pos;
    if (typeof pos === "string" && pos.length) {
      const xyz = pos.split(",").slice(0, 3).map(Number);
      placed.push({
        id: (o.id as number) ?? null,
        gId: (o.gId as string) ?? null,
        pos:
          xyz.length === 3 && xyz.every((n) => !Number.isNaN(n))
            ? (xyz as [number, number, number])
            : null,
      });
    }
  }

  const placedByGId: Record<string, number> = {};
  for (const o of placed)
    if (o.gId) placedByGId[o.gId] = (placedByGId[o.gId] ?? 0) + 1;
  const sortedByGId = Object.fromEntries(
    Object.entries(placedByGId).sort((a, b) => b[1] - a[1]),
  );

  return {
    saveName: (gameState.saveDisplayName as string) ?? null,
    planetId: (gameState.planetId as string) ?? null,
    worldSeed: gameState.worldSeed != null ? num(gameState.worldSeed) : null,
    version: (gameState.version as string) ?? null,
    mode: (gameState.mode as string) ?? null,
    randomizeMineables: (gameState.randomizeMineables as boolean) ?? null,
    terraform,
    counts: {
      worldObjects: worldObjects.length,
      placed: placed.length,
      inventory: worldObjects.length - placed.length,
    },
    placedByGId: sortedByGId,
    placed,
  };
}
