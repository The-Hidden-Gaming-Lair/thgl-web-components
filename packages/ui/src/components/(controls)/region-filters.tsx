import { useMemo, useState } from "react";
import { REGION_FILTERS, useCoordinates, useT } from "../(providers)";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { cn, useUserStore } from "@repo/lib";
import { FoldVertical, Hexagon, UnfoldVertical } from "lucide-react";

export function RegionFilters() {
  const { regions, staticDrawings } = useCoordinates();

  const [open, setOpen] = useState(true);
  const t = useT();
  const filters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);
  const toggleFilter = useUserStore((state) => state.toggleFilter);
  const regionFilters = REGION_FILTERS.filter(
    (filter) =>
      (filter.id === "region_borders" &&
        regions.some((r) => r.border.length > 0)) ||
      (filter.id === "region_names" && regions.length !== 0),
  );
  const filterNames = useMemo(
    () => [
      ...regionFilters.map((filter) => filter.id),
      ...(staticDrawings?.map((filter) => filter.name) ?? []),
    ],
    [staticDrawings, regionFilters],
  );
  const activeFiltersLength = useMemo(
    () => filterNames.filter((filter) => filters.includes(filter)).length,
    [filters, filterNames],
  );
  if (filterNames.length === 0) {
    return null;
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn("flex items-center transition-colors w-full px-1.5", {
          "text-muted-foreground": !activeFiltersLength,
        })}
      >
        <button
          className={cn(
            "text-left transition-colors hover:text-primary p-1 truncate grow",
          )}
          onClick={() => {
            const newFilters = activeFiltersLength
              ? filters.filter((filter) => !filterNames.includes(filter))
              : [...new Set([...filters, ...filterNames])];
            setFilters(newFilters);
          }}
          title={t("drawings")}
          type="button"
        >
          <span className="font-semibold">{t("drawings")}</span>
          <span className="ml-1 text-xs text-muted-foreground">
            ({activeFiltersLength}/{filterNames.length})
          </span>
        </button>
        <CollapsibleTrigger asChild>
          <button className="hover:text-primary p-2">
            {open ? (
              <FoldVertical className="h-4 w-4" />
            ) : (
              <UnfoldVertical className="h-4 w-4" />
            )}
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="flex flex-wrap">
        {regionFilters.map((filter) => (
          <div
            key={filter.id}
            className={cn("flex md:basis-1/2 overflow-hidden")}
          >
            <button
              className={cn(
                "grow flex gap-2 items-center transition-colors hover:text-primary p-2 truncate",
                {
                  "text-muted-foreground": !filters.includes(filter.id),
                },
              )}
              onClick={() => {
                toggleFilter(filter.id);
              }}
              title={t(filter.id)}
              type="button"
            >
              <filter.Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{t(filter.id)}</span>
            </button>
          </div>
        ))}
        {staticDrawings?.map((filter) => (
          <div key={filter.name} className="flex md:basis-1/2 overflow-hidden">
            <button
              className={cn(
                "grow flex gap-2 items-center transition-colors hover:text-primary p-2 truncate",
                {
                  "text-muted-foreground": !filters.includes(filter.name),
                },
              )}
              onClick={() => {
                toggleFilter(filter.name);
              }}
              title={filter.name.replace(/my_\d+_/, "")}
              type="button"
            >
              <Hexagon className={cn("h-5 w-5 shrink-0")} />
              <span className="truncate">
                {filter.name.replace(/my_\d+_/, "")}
              </span>
            </button>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
