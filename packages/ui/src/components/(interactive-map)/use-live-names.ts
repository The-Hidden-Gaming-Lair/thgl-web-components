import { fetchLiveNames } from "@repo/lib";
import { useEffect, useMemo, useState } from "react";
import { useCoordinates, useLocale, useUserStore } from "../(providers)";

/**
 * Names of live actors whose filter value is `liveNames` (Palia "My Plot Items":
 * one filter, a name per placed item), keyed by the raw actor type. Fetched
 * only while one of those filters is on (or `force`, e.g. a live search);
 * null until then.
 */
export function useLiveNames(
  appName: string,
  force = false,
): Record<string, string> | null {
  const { filters } = useCoordinates();
  const locale = useLocale();
  const enabledFilters = useUserStore((state) => state.filters);
  const liveNameTypes = useMemo(
    () =>
      new Set(
        filters.flatMap((f) =>
          f.values.filter((v) => v.liveNames).map((v) => v.id),
        ),
      ),
    [filters],
  );
  const wanted =
    liveNameTypes.size > 0 &&
    (force || enabledFilters.some((id) => liveNameTypes.has(id)));
  const [names, setNames] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    if (!wanted) return;
    let cancelled = false;
    fetchLiveNames(appName, locale)
      .then((loaded) => {
        if (!cancelled) setNames(loaded);
      })
      .catch((error) => {
        console.warn("Live names unavailable", error);
      });
    return () => {
      cancelled = true;
    };
  }, [wanted, appName, locale]);
  return wanted ? names : null;
}
