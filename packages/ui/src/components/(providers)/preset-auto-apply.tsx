"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  planPresetApply,
  resolveAutoApplyPreset,
  useSettingsStore,
  type GlobalFiltersConfig,
  type StoredFilterPreset,
  type TilesConfig,
  type UserStore,
} from "@repo/lib";
import { useT } from "./i18n-provider";

/**
 * Apply a saved filter preset to the stores. The single code path for BOTH
 * the manual selection in the Presets menu and the automatic per-map apply
 * below, so an auto-applied preset behaves exactly like a clicked one.
 */
export function applyFilterPreset(
  preset: StoredFilterPreset,
  {
    userStore,
    globalFilters,
  }: { userStore: UserStore; globalFilters: GlobalFiltersConfig },
): void {
  const plan = planPresetApply(preset, {
    globalFilterIds: globalFilters.flatMap((filter) =>
      filter.values.map((value) => value.id),
    ),
    defaultGlobalFilters: globalFilters.flatMap((filter) =>
      filter.values.flatMap((value) => (value.defaultOn ? value.id : [])),
    ),
  });
  if (plan.filters) {
    const user = userStore.getState();
    user.setFilters(plan.filters.local);
    user.setGlobalFilters(plan.filters.global);
  }
  useSettingsStore.getState().applyPresetSettings(plan.settings);
}

/**
 * Applies the preset bound to a map (settings `presetByMap`) whenever the
 * active map changes: a map-selector switch, browser back/forward, a Peer Link
 * or a live-mode follow of the player onto another map. Rendered once inside
 * CoordinatesProvider, so it runs on every surface (web, Companion App,
 * Overwolf) whether or not the sidebar is mounted. No binding = no change.
 */
export function PresetMapAutoApply({
  enabled,
  userStore,
  globalFilters,
  tilesConfig,
}: {
  /** Both stores hydrated: earlier mapName writes are restores, not switches. */
  enabled: boolean;
  userStore: UserStore;
  globalFilters: GlobalFiltersConfig;
  tilesConfig?: TilesConfig;
}): null {
  const t = useT();

  useEffect(() => {
    if (!enabled) return;
    return userStore.subscribe(
      (state) => state.mapName,
      (mapName, prevMapName) => {
        const { presets, presetByMap } = useSettingsStore.getState();
        const name = resolveAutoApplyPreset({
          prevMap: prevMapName,
          nextMap: mapName,
          presetByMap,
          presets,
          tiles: tilesConfig,
        });
        if (!name) return;
        applyFilterPreset(presets[name], { userStore, globalFilters });
        toast(
          t("presets.autoApplied", {
            fallback: "Preset applied for this map: {{name}}",
            vars: { name },
          }),
        );
      },
    );
  }, [enabled, userStore, globalFilters, tilesConfig, t]);

  return null;
}
