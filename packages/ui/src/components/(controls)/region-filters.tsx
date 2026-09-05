import { useUserStore } from "../(providers)";
import { useMemo, useState } from "react";
import { REGION_FILTERS, useCoordinates, useT } from "../(providers)";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { cn } from "@repo/lib";
import { ChevronRight, Hexagon } from "lucide-react";

export function RegionFilters() {
  const { regions, staticDrawings } = useCoordinates();

  const [open, setOpen] = useState(false);
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

  const ratio =
    filterNames.length > 0 ? activeFiltersLength / filterNames.length : 0;

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
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1 text-left transition-colors hover:text-primary py-1 px-0.5 truncate grow min-w-0",
              {
                "text-muted-foreground": !activeFiltersLength,
              },
            )}
            title={t("drawings")}
            type="button"
          >
            <ChevronRight
              className={cn(
                "h-3 w-3 shrink-0 transition-transform duration-200",
                open && "rotate-90",
              )}
            />
            <span className="font-semibold truncate">{t("drawings")}</span>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
              {activeFiltersLength}/{filterNames.length}
            </span>
          </button>
        </CollapsibleTrigger>
        <button
          className="text-[10px] text-muted-foreground hover:text-primary px-1.5 py-1 transition-colors shrink-0 uppercase tracking-wide"
          onClick={() => {
            const newFilters = activeFiltersLength
              ? filters.filter((filter) => !filterNames.includes(filter))
              : [...new Set([...filters, ...filterNames])];
            setFilters(newFilters);
          }}
          type="button"
          title={
            activeFiltersLength
              ? t("myFilters.disableAll", { fallback: "Disable all" })
              : t("myFilters.enableAll", { fallback: "Enable all" })
          }
        >
          {activeFiltersLength
            ? t("myFilters.none", { fallback: "None" })
            : t("myFilters.all", { fallback: "All" })}
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-[2px] bg-muted/20 mx-1.5 overflow-hidden rounded-full">
        <div
          className="h-full bg-primary/50 transition-all duration-300 rounded-full"
          style={{ width: `${ratio * 100}%` }}
        />
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
