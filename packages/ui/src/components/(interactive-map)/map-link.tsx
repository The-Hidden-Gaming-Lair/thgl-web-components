"use client";

import { Map as MapIcon } from "lucide-react";
import { localizePath } from "@repo/lib";
import { useLocale, useT, useUserStore } from "../(providers)";

// A link from a marker to the map it leads to (`spawn.mapLink`): a door to the next area, a
// world-map location to its area map. Switches the map in place like the interior-layer
// buttons do (interactive-map.tsx enterLayer), keeping the /maps/<title> URL in step.
export function MapLink({ mapName }: { mapName: string }) {
  const t = useT();
  const locale = useLocale();
  const setMapName = useUserStore((state) => state.setMapName);
  const title = t(mapName) || mapName;
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 text-sm text-amber-400 underline underline-offset-2 hover:text-amber-300 text-left"
      onClick={(e) => {
        e.stopPropagation();
        setMapName(mapName);
        if (location.pathname.includes("/maps/")) {
          window.history.pushState(
            {},
            "",
            localizePath(`/maps/${title}`, locale),
          );
        }
      }}
    >
      <MapIcon className="h-3.5 w-3.5 shrink-0" />
      {t("map.goTo", { fallback: "Go to {{map}}", vars: { map: title } })}
    </button>
  );
}
