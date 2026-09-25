"use client";
import { useGameState } from "@repo/lib";
import { useUserStore } from "../(providers)";
import { useCoordinates, useT } from "../(providers)";
import { useEffect, useMemo, useState, type JSX } from "react";
import { ChevronDown, ChevronUp, RadioTower } from "lucide-react";
import { SearchResultRow, useSearchResultJump } from "./search-result-row";

type LiveActors = ReturnType<typeof useGameState.getState>["actors"];

// Same limit and the same reason as markers-search-results.tsx: the results
// share one ScrollArea with the filter list, so a broad query (on Palia
// "infected" matches dozens of live types) must not bury the filter toggles.
const COLLAPSED_RESULT_LIMIT = 6;

// Live actors update at the memory-read poll rate (~10×/s). Subscribing the
// sidebar to the raw store would re-render it on every poll, so this snapshots
// the list at 1Hz — plenty for a search results view. The interval only runs
// while `enabled` (live scope + a long-enough query); setting an unchanged
// store reference bails out of re-rendering.
const SNAPSHOT_MS = 1000;
const NO_ACTORS: LiveActors = [];

function useLiveActorsSnapshot(enabled: boolean): LiveActors {
  const [actors, setActors] = useState<LiveActors>(() =>
    enabled ? useGameState.getState().actors : NO_ACTORS,
  );
  useEffect(() => {
    if (!enabled) {
      // Drop the last snapshot so a large actor list isn't pinned while the
      // live scope is inactive.
      setActors(NO_ACTORS);
      return;
    }
    // Catch up immediately — the sidebar shouldn't wait a second for its first
    // result set after the scope switch / the query settles.
    setActors(useGameState.getState().actors);
    const intervalId = setInterval(() => {
      setActors(useGameState.getState().actors);
    }, SNAPSHOT_MS);
    return () => {
      clearInterval(intervalId);
    };
  }, [enabled]);
  return actors;
}

/** A matching display type with its actors bucketed by map. */
export type LiveSearchGroup = readonly [
  displayType: string,
  byMap: Map<string, LiveActors>,
];

/**
 * Live actors matching `query`, bucketed displayType → mapName → actors.
 * Exported so the sidebar header can show the row count without walking the
 * actor list a second time (it can hold tens of thousands of static actors).
 * Call it ONCE, in MarkersSearch, and pass the result down.
 *
 * Only actors whose resolved filter-type name (or raw type id) matches the
 * query, independent of the active filters — searching should find live
 * entities you have not enabled yet. Actors without a mapName belong to the
 * current map (same convention as the live marker pipeline in markers.tsx).
 */
export function useLiveSearchGroups(
  query: string,
  enabled: boolean,
): LiveSearchGroup[] {
  const { typesIdMap } = useCoordinates();
  const t = useT();
  const mapName = useUserStore((state) => state.mapName);
  const actors = useLiveActorsSnapshot(enabled);

  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!enabled || !q || !typesIdMap) return [];
    const reduced = new Map<string, Map<string, LiveActors>>();
    for (const actor of actors) {
      if (actor.hidden) continue;
      const displayType =
        typesIdMap[actor.type] ?? typesIdMap[actor.type.split("_Variant.")[0]];
      if (!displayType) continue;
      const name = t(displayType, { fallback: displayType });
      if (
        !name.toLowerCase().includes(q) &&
        !displayType.toLowerCase().includes(q)
      ) {
        continue;
      }
      const actorMapName = actor.mapName ?? mapName;
      let byMap = reduced.get(displayType);
      if (!byMap) {
        byMap = new Map();
        reduced.set(displayType, byMap);
      }
      const members = byMap.get(actorMapName);
      if (members) {
        members.push(actor);
      } else {
        byMap.set(actorMapName, [actor]);
      }
    }
    return Array.from(reduced.entries());
  }, [actors, typesIdMap, query, mapName, t, enabled]);
}

/** How many rows those groups render — one per (display type, map). */
export function countLiveSearchRows(groups: LiveSearchGroup[]): number {
  // byMap.size, not groups.length: a type present on two maps is two rows.
  return groups.reduce((total, [, byMap]) => total + byMap.size, 0);
}

export function MarkersSearchLiveResults({
  appName,
  hasMultipleMaps,
  iconsPath,
  groups,
  query,
}: {
  appName: string;
  hasMultipleMaps: boolean;
  iconsPath: string;
  groups: LiveSearchGroup[];
  query: string;
}): JSX.Element {
  const { icons, liveCapable } = useCoordinates();
  const t = useT();
  const selectedResult = useUserStore((state) => state.selectedSearchResult);
  const setSelectedResult = useUserStore(
    (state) => state.setSelectedSearchResult,
  );
  const jumpToResult = useSearchResultJump();
  const [showAll, setShowAll] = useState(false);

  // A new query starts capped again. Deliberately keyed on the query and NOT
  // on `groups`: that array is rebuilt on every 1Hz snapshot while live data
  // flows, which would undo the user's "Show all" click a second after it.
  useEffect(() => {
    setShowAll(false);
  }, [query]);

  const rows = useMemo(
    () =>
      groups.flatMap(([displayType, byMap]) =>
        Array.from(byMap.entries()).map(
          ([groupedMapName, members]) =>
            [displayType, groupedMapName, members] as const,
        ),
      ),
    [groups],
  );
  const visibleRows = showAll ? rows : rows.slice(0, COLLAPSED_RESULT_LIMIT);

  if (!liveCapable) {
    return (
      <div className="p-2 text-center text-muted-foreground text-xs">
        <RadioTower className="w-4 h-4 mx-auto mb-1" />
        {t("markers.search.liveNeedsApp")}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-2 text-center text-muted-foreground text-xs">
        <span className="block text-bold">ಥ_ಥ</span>
        {t("markers.search.noLiveResults")}
      </div>
    );
  }

  return (
    <>
      {visibleRows.map(([displayType, groupedMapName, members]) => {
        const name = t(displayType, { fallback: displayType });
        // Live rows are identified by their type id — processActors renders
        // the selected type's actors even when its filter is off.
        const isSelected =
          selectedResult?.name === displayType &&
          selectedResult.mapName === groupedMapName;
        return (
          <SearchResultRow
            key={`${displayType}-${groupedMapName}`}
            appName={appName}
            iconsPath={iconsPath}
            icon={icons.get(displayType)}
            title={name}
            label={name}
            count={members.length > 1 ? `${members.length}×` : undefined}
            subtitle={
              <>
                {t("markers.search.scopeLive")}
                {hasMultipleMaps && (
                  <span>{` - ${t(groupedMapName) || groupedMapName}`}</span>
                )}
              </>
            }
            selected={isSelected}
            onClick={() => {
              if (isSelected) {
                setSelectedResult(null);
                return;
              }
              setSelectedResult({
                name: displayType,
                mapName: groupedMapName,
              });
              jumpToResult(
                groupedMapName,
                members.map((actor) => [actor.x, actor.y]),
              );
            }}
          />
        );
      })}
      {rows.length > COLLAPSED_RESULT_LIMIT && (
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
                vars: { count: String(rows.length) },
              })}
            </>
          )}
        </button>
      )}
    </>
  );
}
