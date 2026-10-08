import {
  FiltersConfig,
  getHiddenLiveOnlyFilters,
  isApp,
  useAccountStore,
  useEffectiveLiveMode,
  useSettingsStore,
} from "@repo/lib";
import { Radio } from "lucide-react";
import { useMemo } from "react";
import { useT, useUserStore } from "../(providers)";

/**
 * Live-only filters (no_map_markers) have no predicted markers, so in
 * Predicted mode (global, or a per-filter override) they plot nothing. Returns
 * the ticked ones that are hidden that way plus the hint explaining why, so
 * the empty map isn't read as "this is broken" (#903). App only: the website
 * has no live mode to switch.
 */
export function useLiveOnlyHidden(values: FiltersConfig[number]["values"]) {
  const t = useT();
  const filters = useUserStore((state) => state.filters);
  const effectiveLiveMode = useEffectiveLiveMode();
  const liveModeByFilter = useSettingsStore((s) => s.liveModeByFilter);
  const hasPreviewAccess = useAccountStore((s) => s.perks.previewReleaseAccess);
  const hidden = useMemo(
    () =>
      isApp
        ? getHiddenLiveOnlyFilters(
            values,
            filters,
            effectiveLiveMode,
            liveModeByFilter,
            hasPreviewAccess,
          )
        : new Set<string>(),
    [values, filters, effectiveLiveMode, liveModeByFilter, hasPreviewAccess],
  );
  const hint =
    effectiveLiveMode === "static"
      ? t("liveMode.liveOnlyHint", {
          fallback: "Live only - switch Live mode to Live or Combined",
        })
      : t("liveMode.liveOnlyFilterHint", {
          fallback:
            "Live only - this filter's Live Mode is set to Predicted (filter settings)",
        });
  return { hidden, hint };
}

export function LiveOnlyIcon({
  hint,
  className = "h-3 w-3",
}: {
  hint: string;
  className?: string;
}) {
  return (
    <span className="shrink-0" title={hint}>
      <Radio className={`${className} text-orange-500`} aria-label={hint} />
    </span>
  );
}
