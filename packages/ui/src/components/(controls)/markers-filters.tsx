import { cn, useSettingsStore } from "@repo/lib";
import { ReactNode } from "react";
import {
  REGION_FILTERS,
  useCoordinates,
  useT,
  useUserStore,
} from "../(providers)";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Separator } from "../ui/separator";
import { Presets } from "./presets";
import { MapSelect } from "./map-select";
import { GlobalFilters } from "./global-filters";
import { MyFilters } from "./my-filters";
import { FilterTooltip } from "./filter-tooltip";

export function MarkersFilters({
  mapNames,
  children,
}: {
  mapNames: string[];
  children?: ReactNode;
}): JSX.Element {
  const { filters: filterDetails, regions } = useCoordinates();
  const t = useT();
  const { filters, setFilters, toggleFilter } = useUserStore();
  const liveMode = useSettingsStore((state) => state.liveMode);

  return (
    <>
      {children && (
        <>
          {children}
          <Separator />
        </>
      )}
      {mapNames.length > 1 && (
        <>
          <MapSelect mapNames={mapNames} />
          <Separator />
        </>
      )}
      <Presets />
      <Separator />
      <GlobalFilters />
      <MyFilters />
      {regions.length > 0 && (
        <Collapsible defaultOpen>
          <div
            className={cn("flex items-center transition-colors w-full px-1.5", {
              "text-muted-foreground": !REGION_FILTERS.some((f) =>
                filters.includes(f.id),
              ),
            })}
          >
            <button
              className={cn(
                "text-left transition-colors hover:text-primary p-1 truncate grow",
              )}
              onClick={() => {
                const newFilters = REGION_FILTERS.some((f) =>
                  filters.includes(f.id),
                )
                  ? filters.filter(
                      (filter) =>
                        !REGION_FILTERS.some((value) => value.id === filter),
                    )
                  : [
                      ...new Set([
                        ...filters,
                        ...REGION_FILTERS.map((f) => f.id),
                      ]),
                    ];
                setFilters(newFilters);
              }}
              title={t("drawings")}
              type="button"
            >
              {t("drawings")}
            </button>
            <CollapsibleTrigger asChild>
              <button className="transition-colors hover:text-primary p-2">
                <CaretSortIcon className="h-4 w-4" />
              </button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="flex flex-wrap">
            {REGION_FILTERS.map((filter) => (
              <div
                key={filter.id}
                className={cn("flex md:basis-1/2 overflow-hidden", {
                  hidden:
                    filter.id === "region_borders" &&
                    !regions.some((r) => r.border.length > 0),
                })}
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
          </CollapsibleContent>
        </Collapsible>
      )}
      <div className="flex flex-col w-[175px] md:w-full">
        {filterDetails.map(({ group, values, defaultOpen }) => {
          const hasActiveFilters = values.some((filter) =>
            filters.includes(filter.id),
          );
          return (
            <Collapsible key={group} defaultOpen={defaultOpen}>
              <div
                className={cn(
                  "flex items-center transition-colors w-full px-1.5",
                  {
                    "text-muted-foreground": !hasActiveFilters,
                  },
                )}
              >
                <button
                  className={cn(
                    "text-left transition-colors hover:text-primary p-1 truncate grow",
                    {
                      "text-muted-foreground": !hasActiveFilters,
                    },
                  )}
                  onClick={() => {
                    const newFilters = hasActiveFilters
                      ? filters.filter(
                          (filter) =>
                            !values.some((value) => value.id === filter),
                        )
                      : [
                          ...new Set([
                            ...filters,
                            ...values.map((value) => value.id),
                          ]),
                        ];
                    setFilters(newFilters);
                  }}
                  title={t(group)}
                  type="button"
                >
                  {t(group) || group}
                </button>
                <CollapsibleTrigger asChild>
                  <button className="transition-colors hover:text-primary p-2">
                    <CaretSortIcon className="h-4 w-4" />
                  </button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="flex flex-wrap">
                {values
                  .sort((a, b) => t(a.id).localeCompare(t(b.id)))
                  .map((filter) => (
                    <div
                      key={filter.id}
                      className="flex md:basis-1/2 overflow-hidden"
                    >
                      <Tooltip delayDuration={50} disableHoverableContent>
                        <TooltipTrigger asChild>
                          <button
                            className={cn(
                              "grow flex gap-2 items-center transition-colors hover:text-primary p-2 truncate",
                              {
                                "text-muted-foreground": !filters.includes(
                                  filter.id,
                                ),
                              },
                            )}
                            onClick={() => {
                              toggleFilter(filter.id);
                            }}
                            type="button"
                          >
                            <img
                              alt=""
                              className="h-5 w-5 shrink-0"
                              height={20}
                              src={`/icons/${filter.icon}`}
                              width={20}
                            />
                            <span className="truncate">
                              {t(filter.id) || filter.id}
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-96">
                          {filter.live_only && (
                            <p className="font-bold tex-lg text-orange-500">
                              This filter is only available with the live mode
                              of the In-Game app.
                            </p>
                          )}
                          <FilterTooltip id={filter.id} />
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </>
  );
}
