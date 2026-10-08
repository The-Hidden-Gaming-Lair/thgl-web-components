import type { Drawing } from "./settings";

const SHAPE_KEYS = [
  "polylines",
  "rectangles",
  "polygons",
  "circles",
  "texts",
] as const;

/**
 * The drawing editor only loads the shapes of the map that is open, so an
 * edit/remove rebuild only knows those. Replace just that map's shapes and keep
 * every shape on other maps (and legacy shapes without a mapName, which the
 * editor never loads either) - otherwise erasing one shape wipes the drawing on
 * every other map.
 */
export function mergeDrawingForMap(
  current: Partial<Drawing>,
  rebuilt: Pick<Partial<Drawing>, (typeof SHAPE_KEYS)[number]>,
  mapName: string,
): Partial<Drawing> {
  const merged: Partial<Drawing> = { ...current };
  for (const key of SHAPE_KEYS) {
    const kept = (current[key] ?? []).filter(
      (shape) => shape.mapName !== mapName,
    );
    merged[key] = [...kept, ...(rebuilt[key] ?? [])] as never;
  }
  return merged;
}
