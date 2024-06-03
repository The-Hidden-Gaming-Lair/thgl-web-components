import { cn } from "@repo/lib";
import { useMap } from "../(interactive-map)/store";
import { useCoordinates, useT, useUserStore } from "../(providers)";
import { useMemo } from "react";
import { MapPin } from "lucide-react";

export function MarkersSearchResults({
  mapNames,
}: {
  mapNames: string[];
}): JSX.Element {
  const { icons, spawns } = useCoordinates();
  const map = useMap();
  const t = useT();
  const mapName = useUserStore((state) => state.mapName);
  const setMapName = useUserStore((state) => state.setMapName);

  const groupedSpawns = useMemo(() => {
    const reduced = spawns.reduce(
      (acc, spawn) => {
        const key = spawn.id ?? spawn.type;
        const mapName = spawn.mapName ?? "default";
        acc[key] = acc[key] || {};
        acc[key][mapName] = acc[key][mapName] || [];
        acc[key][mapName].push(spawn);
        return acc;
      },
      {} as Record<string, Record<string, typeof spawns>>
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
          const icon = icons.find((icon) => icon.id === spawns[0].type);
          return (
            <button
              className={cn(
                "flex gap-2 items-center hover:text-primary p-2 truncate w-full"
              )}
              key={`${key}-${groupedMapName}`}
              onClick={() => {
                if (groupedMapName !== mapName) {
                  setMapName(groupedMapName);
                } else {
                  const bounds = spawns.map((spawn) => spawn.p);
                  map?.fitBounds(bounds, {
                    duration: 1,
                    maxZoom: 4,
                    padding: [50, 50],
                  });
                }
              }}
              title={t(key) ?? key}
              type="button"
            >
              {icon ? (
                <img
                  alt=""
                  className="h-5 w-5 shrink-0"
                  height={20}
                  src={`/icons/${icon.icon}`}
                  width={20}
                />
              ) : (
                <MapPin className="h-5 w-5 shrink-0" />
              )}
              <div className="text-left">
                <div className="truncate">
                  {spawns[0].isPrivate ? spawns[0].name : t(key)}
                  {spawns.length > 1 && (
                    <span className="ml-1 text-gray-400 text-xs">
                      {spawns.length} times
                    </span>
                  )}
                </div>
                {mapNames.length > 1 && (
                  <div className="text-gray-400 text-xs">
                    {t(groupedMapName) || groupedMapName}
                  </div>
                )}
              </div>
            </button>
          );
        })
      )}
    </>
  );
}
