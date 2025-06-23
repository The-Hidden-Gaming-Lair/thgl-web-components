"use client";
import { useMapStore } from "../(interactive-map)/store";
import { useEffect, useMemo, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { cn, useUserStore } from "@repo/lib";
import { FoldVertical, UnfoldVertical } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

const RESOURCE_HEATMAPS = [
  {
    name: "Aluminum Ore",
    url: "/heatmaps/bp_a_survival_aluminum_heatmap.webp",
  },
  {
    name: "Agave Seeds",
    url: "/heatmaps/bp_a_survival_saguaro_heatmap.webp",
  },
  { name: "Basalt Stone", url: "/heatmaps/bp_a_survival_basalt_heatmap.webp" },
  { name: "Carbon Ore", url: "/heatmaps/bp_a_survival_carbon_heatmap.webp" },
  { name: "Copper Ore", url: "/heatmaps/bp_a_survival_copper_heatmap.webp" },
  { name: "Iron Ore", url: "/heatmaps/bp_a_survival_iron_heatmap.webp" },
  {
    name: "Jasmium Crystal",
    url: "/heatmaps/bp_a_survival_jasmium_heatmap.webp",
  },
  { name: "Plant Fiber", url: "/heatmaps/bp_a_survival_fiber_heatmap.webp" },
];
export function DuneHeatmaps() {
  const [open, setOpen] = useState(false);
  const { map, leaflet } = useMapStore();
  const filters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);
  const resourceFilterNames = useMemo(
    () => RESOURCE_HEATMAPS.map((filter) => filter.name),
    [],
  );
  const activeResourceFilter = useMemo(
    () => resourceFilterNames.find((filter) => filters.includes(filter)),
    [filters, resourceFilterNames],
  );

  useEffect(() => {
    if (!map || !leaflet) {
      return;
    }
    if (map.mapName !== "survival_1") {
      return;
    }
    if (!activeResourceFilter) {
      return;
    }
    const resourceHeatmap = RESOURCE_HEATMAPS.find(
      (heatmap) => heatmap.name === activeResourceFilter,
    );
    if (!resourceHeatmap) {
      return;
    }

    const imageOverlay = leaflet.imageOverlay(resourceHeatmap.url, map.bounds);
    imageOverlay.addTo(map);

    return () => {
      try {
        imageOverlay.removeFrom(map);
      } catch (e) {
        //
      }
    };
  }, [map, activeResourceFilter]);

  if (!map) {
    return <Skeleton className="h-7 w-full" />;
  }
  if (map?.mapName !== "survival_1") {
    return <></>;
  }
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={cn("flex items-center transition-colors w-full px-1.5")}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "text-left transition-colors p-1 pr-2 truncate grow flex items-center justify-between",
            )}
            title="Resource Heatmaps"
            type="button"
          >
            <span className="font-semibold">Resource Heatmaps</span>
            {open ? (
              <FoldVertical className="h-4 w-4" />
            ) : (
              <UnfoldVertical className="h-4 w-4" />
            )}
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="flex flex-wrap">
        <div className="italic text-xs text-muted-foreground px-2.5 py-1">
          Brighter areas have more spawns density.
        </div>
        {RESOURCE_HEATMAPS.map((heatmap) => (
          <div
            key={heatmap.name}
            className={cn("flex md:basis-1/2 overflow-hidden")}
          >
            <button
              className={cn(
                "grow flex gap-2 items-center transition-colors hover:text-primary py-1 px-2.5 truncate",
                {
                  "text-muted-foreground": !filters.includes(heatmap.name),
                },
              )}
              onClick={() => {
                const otherFilters = filters.filter(
                  (f) => !resourceFilterNames.includes(f),
                );
                const newFilters = filters.includes(heatmap.name)
                  ? otherFilters
                  : [...otherFilters, heatmap.name];
                setFilters(newFilters);
              }}
              title={heatmap.name}
              type="button"
            >
              <span className="truncate">{heatmap.name}</span>
            </button>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
