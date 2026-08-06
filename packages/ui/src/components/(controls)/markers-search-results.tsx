import { useUserStore } from "../(providers)";
import { useCoordinates, useT } from "../(providers)";
import { useEffect, useMemo, useState, type JSX } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SearchResultRow, useSearchResultJump } from "./search-result-row";

// The results share the panel with the filtered filter list now (they no
// longer replace it), so a broad query mustn't bury the filters — show the
// closest matches and put the rest behind an expander.
const COLLAPSED_RESULT_LIMIT = 6;

export function MarkersSearchResults({
  appName,
  hasMultipleMaps,
  iconsPath,
}: {
  appName: string;
  hasMultipleMaps: boolean;
  iconsPath: string;
}): JSX.Element {
  const { icons, searchResults: spawns } = useCoordinates();
  const t = useT();
  const mapName = useUserStore((state) => state.mapName);
  const jumpToResult = useSearchResultJump();
  const [showAll, setShowAll] = useState(false);
  const flatResults = useMemo(() => {
    const reduced = spawns.reduce(
      (acc, spawn) => {
        spawn.cluster?.forEach((cluster) => {
          const key = t(cluster.id, { fallback: cluster.type });
          const mapName = cluster.mapName ?? "default";
          acc[key] = acc[key] || {};
          acc[key][mapName] = acc[key][mapName] || [];
          acc[key][mapName].push(cluster);
        });
        const key = t(spawn.id, { fallback: spawn.type });
        const mapName = spawn.mapName ?? "default";
        acc[key] = acc[key] || {};
        acc[key][mapName] = acc[key][mapName] || [];
        acc[key][mapName].push(spawn);
        return acc;
      },
      {} as Record<string, Record<string, typeof spawns>>,
    );
    // One row per (name, map), current map's matches first so the collapsed
    // view surfaces the results the user can jump to without a map switch.
    const flat = Object.entries(reduced).flatMap(([key, typeSpawns]) =>
      Object.entries(typeSpawns).map(
        ([groupedMapName, groupedSpawns]) =>
          [key, groupedMapName, groupedSpawns] as const,
      ),
    );
    const offMap = (m: string) => m !== mapName && m !== "default";
    flat.sort((a, b) => Number(offMap(a[1])) - Number(offMap(b[1])));
    return flat;
  }, [spawns, mapName]);

  // A new result set (new query) starts collapsed again.
  useEffect(() => {
    setShowAll(false);
  }, [spawns]);

  const visibleResults = showAll
    ? flatResults
    : flatResults.slice(0, COLLAPSED_RESULT_LIMIT);

  return (
    <>
      {spawns.length === 0 && (
        <div className="p-2 text-center">
          <span className="block text-bold">ಥ_ಥ</span>
          Nothing found
        </div>
      )}
      {visibleResults.map(([key, groupedMapName, spawns]) => (
        <SearchResultRow
          key={`${key}-${groupedMapName}`}
          appName={appName}
          iconsPath={iconsPath}
          icon={icons.get(spawns[0].type)}
          title={key}
          label={
            spawns[0].isPrivate && spawns[0].name
              ? t(spawns[0].name, { fallback: spawns[0].name })
              : key
          }
          count={spawns.length > 1 ? `${spawns.length} times` : undefined}
          subtitle={
            <>
              {t(spawns[0].type, { fallback: spawns[0].type })}
              {hasMultipleMaps && (
                <span>{` - ${t(groupedMapName) || groupedMapName}`}</span>
              )}
            </>
          }
          onClick={() => {
            jumpToResult(
              spawns[0].type,
              groupedMapName,
              spawns.map((spawn) => spawn.p),
            );
          }}
        />
      ))}
      {flatResults.length > COLLAPSED_RESULT_LIMIT && (
        <button
          className="flex w-full items-center justify-center gap-1 p-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          onClick={() => {
            setShowAll((prev) => !prev);
          }}
          type="button"
        >
          {showAll ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              {t("markers.search.showFewer")}
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              {t("markers.search.showAll", {
                vars: { count: String(flatResults.length) },
              })}
            </>
          )}
        </button>
      )}
    </>
  );
}
