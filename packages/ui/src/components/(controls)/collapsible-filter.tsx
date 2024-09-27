import { cn } from "@repo/lib";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { FilterTooltip } from "./filter-tooltip";
import { FiltersCoordinates, useT, useUserStore } from "../(providers)";
import { useState } from "react";
import { FoldVertical, UnfoldVertical, X } from "lucide-react";

export function CollapsibleFilter({
  filter,
}: {
  filter: FiltersCoordinates[number];
}) {
  const [open, setOpen] = useState(filter.defaultOpen ?? false);

  const t = useT();
  const filters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);
  const toggleFilter = useUserStore((state) => state.toggleFilter);

  const hasActiveFilters = filter.values.some((filter) =>
    filters.includes(filter.id),
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn("flex items-center transition-colors w-full px-1.5", {
          "text-muted-foreground": !hasActiveFilters,
        })}
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
                  (f) => !filter.values.some((value) => value.id === f),
                )
              : [
                  ...new Set([
                    ...filters,
                    ...filter.values.map((value) => value.id),
                  ]),
                ];
            setFilters(newFilters);
          }}
          title={t(filter.group)}
          type="button"
        >
          {t(filter.group) || filter.group}
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
        {filter.values
          .sort((a, b) => t(a.id).localeCompare(t(b.id)))
          .map((f) => (
            <div key={f.id} className="flex md:basis-1/2 overflow-hidden">
              <Tooltip delayDuration={50} disableHoverableContent>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "grow flex gap-2 items-center transition-colors hover:text-primary p-2 truncate",
                      {
                        "text-muted-foreground": !filters.includes(f.id),
                      },
                    )}
                    onClick={() => {
                      toggleFilter(f.id);
                    }}
                    type="button"
                  >
                    <img
                      alt=""
                      className="h-5 w-5 shrink-0"
                      height={20}
                      src={`/icons/${f.icon}`}
                      width={20}
                    />
                    <span className="truncate">{t(f.id) || f.id}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-96">
                  {f.live_only && (
                    <p className="font-bold tex-lg text-orange-500">
                      This filter is only available with the live mode of the
                      In-Game app.
                    </p>
                  )}
                  <FilterTooltip id={f.id} />
                </TooltipContent>
              </Tooltip>
            </div>
          ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
