import { cn, getIconsUrl, useUserStore } from "@repo/lib";
import { useMap } from "../(interactive-map)/store";
import { useCoordinates, useT } from "../(providers)";
import { useMemo } from "react";
import { MapPin } from "lucide-react";

export function MarkersSearchResults({
  appName,
  hasMultipleMaps,
  iconsPath,
}: {
  appName: string;
  hasMultipleMaps: boolean;
  iconsPath: string;
}): JSX.Element {
  const { icons, spawns } = useCoordinates();
  const map = useMap();
  const t = useT();
  const mapName = useUserStore((state) => state.mapName);
  const setMapName = useUserStore((state) => state.setMapName);
  const groupedSpawns = useMemo(() => {
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
    return Object.entries(reduced);
  }, [spawns]);

  return (
    <>
      {spawns.length === 0 && (
        <div className="p-2 text-center">
          <span className="block text-bold">ಥ_ಥ</span>
          Nothing found
        </div>
      )}
      {groupedSpawns.map(([key, typeSpawns]) =>
        Object.entries(typeSpawns).map(([groupedMapName, spawns]) => {
          const icon = icons.get(spawns[0].type);
          return (
            <button
              className={cn(
                "flex gap-2 items-center hover:text-primary p-2 truncate w-full",
              )}
              key={`${key}-${groupedMapName}`}
              onClick={() => {
                if (groupedMapName !== mapName) {
                  setMapName(groupedMapName);
                  if (location.pathname.includes("/maps/")) {
                    window.history.pushState(
                      {},
                      "",
                      `/maps/${t(groupedMapName)}`,
                    );
                  }
                } else {
                  const bounds = spawns.map((spawn) => spawn.p);
                  map?.fitBounds(bounds, {
                    duration: 1,
                    maxZoom: 4,
                    padding: [50, 50],
                  });
                }
              }}
              title={key}
              type="button"
            >
              {icon ? (
                typeof icon.icon === "string" ? (
                  <img
                    alt=""
                    className="h-5 w-5 shrink-0"
                    height={20}
                    src={getIconsUrl(appName, icon.icon, iconsPath)}
                    width={20}
                  />
                ) : (
                  <img
                    alt=""
                    className="shrink-0 object-none w-[64px] h-[64px]"
                    src={getIconsUrl(appName, icon.icon.url, iconsPath)}
                    width={icon.icon.width}
                    height={icon.icon.height}
                    style={{
                      objectPosition: `-${icon.icon.x}px -${icon.icon.y}px`,
                      zoom: 0.35,
                    }}
                  />
                )
              ) : (
                <MapPin className="h-5 w-5 shrink-0" />
              )}
              <div className="text-left">
                <div className="truncate">
                  {spawns[0].isPrivate ? spawns[0].name : key}
                  {spawns.length > 1 && (
                    <span className="ml-1 text-gray-400 text-xs">
                      {spawns.length} times
                    </span>
                  )}
                </div>
                <div className="text-gray-400 text-xs">
                  {t(spawns[0].type)}
                  {hasMultipleMaps && (
                    <span>{` - ${t(groupedMapName) || groupedMapName}`}</span>
                  )}
                </div>
              </div>
            </button>
          );
        }),
      )}
    </>
  );
}
