import type { FilterPreset } from "./settings";

/**
 * Filter presets: the pure logic behind applying a saved preset and the
 * per-map "auto-apply this preset" binding (`presetByMap` in the settings
 * store, mapName → preset name). Kept out of settings.ts / the components so
 * it can be unit tested (filter-presets.test.ts) and shared by the manual
 * apply (Presets menu) and the automatic apply on a map switch.
 */

export type StoredFilterPreset = string[] | FilterPreset;

/** Legacy presets are a bare string[] (filters only); new ones are FilterPreset. */
export function normalizeFilterPreset(
  preset: StoredFilterPreset,
): FilterPreset {
  return Array.isArray(preset) ? { filters: preset } : preset;
}

export type PresetApplyPlan = {
  /** Undefined when the preset did not capture filters (leave them alone). */
  filters?: { local: string[]; global: string[] };
  settings: {
    iconSizes?: {
      baseIconSize: number;
      iconSizeByGroup: Record<string, number>;
      iconSizeByFilter: Record<string, number>;
    };
    audioAlertByFilter?: Record<string, boolean>;
  };
};

/**
 * What applying `preset` changes. Filter ids are split into the regular
 * (user store `filters`) and global (`globalFilters`) lists; a preset without
 * any global filter falls back to the game's default-on globals, so applying
 * it never hides every marker behind an empty global selection.
 */
export function planPresetApply(
  preset: StoredFilterPreset,
  context: { globalFilterIds: string[]; defaultGlobalFilters: string[] },
): PresetApplyPlan {
  const normalized = normalizeFilterPreset(preset);
  const plan: PresetApplyPlan = { settings: {} };
  if (normalized.filters) {
    const globalIds = new Set(context.globalFilterIds);
    const global: string[] = [];
    const local: string[] = [];
    for (const id of normalized.filters) {
      (globalIds.has(id) ? global : local).push(id);
    }
    plan.filters = {
      local,
      global: global.length === 0 ? context.defaultGlobalFilters : global,
    };
  }
  if (normalized.iconSizeByGroup !== undefined) {
    plan.settings.iconSizes = {
      baseIconSize: normalized.baseIconSize ?? 1,
      iconSizeByGroup: normalized.iconSizeByGroup,
      iconSizeByFilter: normalized.iconSizeByFilter ?? {},
    };
  }
  if (normalized.audioAlertByFilter !== undefined) {
    plan.settings.audioAlertByFilter = normalized.audioAlertByFilter;
  }
  return plan;
}

/** Minimal tiles shape: only the layer parent matters here. */
type LayerTiles = Record<string, { layer?: { parent?: string } } | undefined>;

/**
 * The map a binding is stored under: interior floors resolve to their surface
 * (bindings are set on top-level maps in the map selector), so walking into a
 * floor of the same surface and back is not a map change.
 */
export function presetBindingMap(mapName: string, tiles?: LayerTiles): string {
  return tiles?.[mapName]?.layer?.parent ?? mapName;
}

/**
 * Bind `presetName` to `mapName` (one binding per map: replaces any other
 * preset on that map), or clear the map's binding with `null`.
 */
export function bindPresetToMap(
  presetByMap: Record<string, string> | undefined,
  mapName: string,
  presetName: string | null,
): Record<string, string> {
  const next = { ...(presetByMap ?? {}) };
  if (presetName) {
    next[mapName] = presetName;
  } else {
    delete next[mapName];
  }
  return next;
}

/** Remove every binding that points at `presetName` (preset deleted). */
export function dropPresetBindings(
  presetByMap: Record<string, string> | undefined,
  presetName: string,
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [mapName, name] of Object.entries(presetByMap ?? {})) {
    if (name !== presetName) next[mapName] = name;
  }
  return next;
}

/** Maps (binding keys) that auto-apply `presetName`. */
export function mapsForPreset(
  presetByMap: Record<string, string> | undefined,
  presetName: string,
): string[] {
  return Object.entries(presetByMap ?? {})
    .filter(([, name]) => name === presetName)
    .map(([mapName]) => mapName);
}

/**
 * The preset bound to `mapName`, or null when there is none or the binding
 * points at a preset that no longer exists (a stale binding never applies).
 */
export function presetBoundToMap(
  presetByMap: Record<string, string> | undefined,
  presets: Record<string, StoredFilterPreset>,
  mapName: string,
): string | null {
  const name = presetByMap?.[mapName];
  if (!name || !Object.prototype.hasOwnProperty.call(presets, name)) {
    return null;
  }
  return name;
}

/**
 * The preset to auto-apply when the active map changes from `prevMap` to
 * `nextMap`, or null for "change nothing": no real change (same map, or a
 * floor of the same surface), no binding, or a stale binding.
 */
export function resolveAutoApplyPreset({
  prevMap,
  nextMap,
  presetByMap,
  presets,
  tiles,
}: {
  prevMap: string | null | undefined;
  nextMap: string | null | undefined;
  presetByMap: Record<string, string> | undefined;
  presets: Record<string, StoredFilterPreset>;
  tiles?: LayerTiles;
}): string | null {
  if (!nextMap) return null;
  const next = presetBindingMap(nextMap, tiles);
  if (prevMap && presetBindingMap(prevMap, tiles) === next) return null;
  return presetBoundToMap(presetByMap, presets, next);
}
