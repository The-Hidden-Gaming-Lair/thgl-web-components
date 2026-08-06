"use client";
import { useGameState } from "@repo/lib";
import { useUserStore } from "../(providers)";
import { useCoordinates, useT } from "../(providers)";
import { useEffect, useMemo, useState, type JSX } from "react";
import { RadioTower } from "lucide-react";
import { SearchResultRow, useSearchResultJump } from "./search-result-row";

type LiveActors = ReturnType<typeof useGameState.getState>["actors"];

// Live actors update at the memory-read poll rate (~10×/s). Subscribing the
// sidebar to the raw store would re-render it on every poll, so this snapshots
// the list at 1Hz — plenty for a search results view. The interval only exists
// while this component is mounted (live scope + active query), and setting an
// unchanged store reference bails out of re-rendering.
const SNAPSHOT_MS = 1000;

function useLiveActorsSnapshot(): LiveActors {
  const [actors, setActors] = useState<LiveActors>(
    () => useGameState.getState().actors,
  );
  useEffect(() => {
    const intervalId = setInterval(() => {
      setActors(useGameState.getState().actors);
    }, SNAPSHOT_MS);
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  return actors;
}

export function MarkersSearchLiveResults({
  appName,
  hasMultipleMaps,
  iconsPath,
  query,
}: {
  appName: string;
  hasMultipleMaps: boolean;
  iconsPath: string;
  query: string;
}): JSX.Element {
  const { icons, typesIdMap, liveCapable } = useCoordinates();
  const t = useT();
  const mapName = useUserStore((state) => state.mapName);
  const jumpToResult = useSearchResultJump();
  const actors = useLiveActorsSnapshot();

  // displayType → mapName → member actors, restricted to actors whose resolved
  // filter-type name (or raw type id) matches the query. Independent of active
  // filters — searching should find live entities you haven't enabled yet.
  // Actors without a mapName belong to the current map (same convention as the
  // live marker pipeline in markers.tsx).
  const groupedActors = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !typesIdMap) return [];
    const reduced = new Map<string, Map<string, LiveActors>>();
    for (const actor of actors) {
      if (actor.hidden) continue;
      const displayType = typesIdMap[actor.type];
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
  }, [actors, typesIdMap, query, mapName, t]);

  if (!liveCapable) {
    return (
      <div className="p-2 text-center text-muted-foreground text-xs">
        <RadioTower className="w-4 h-4 mx-auto mb-1" />
        {t("markers.search.liveNeedsApp")}
      </div>
    );
  }

  if (groupedActors.length === 0) {
    return (
      <div className="p-2 text-center text-muted-foreground text-xs">
        <span className="block text-bold">ಥ_ಥ</span>
        {t("markers.search.noLiveResults")}
      </div>
    );
  }

  return (
    <>
      {groupedActors.map(([displayType, byMap]) =>
        Array.from(byMap.entries()).map(([groupedMapName, members]) => {
          const name = t(displayType, { fallback: displayType });
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
              onClick={() => {
                jumpToResult(
                  displayType,
                  groupedMapName,
                  members.map((actor) => [actor.x, actor.y]),
                );
              }}
            />
          );
        }),
      )}
    </>
  );
}
