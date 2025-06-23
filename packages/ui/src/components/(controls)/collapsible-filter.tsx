import { cn, FiltersConfig, getIconsUrl, useUserStore } from "@repo/lib";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { FilterTooltip } from "./filter-tooltip";
import { useT } from "../(providers)";
import { useMemo, useState } from "react";
import { FoldVertical, UnfoldVertical } from "lucide-react";

export function CollapsibleFilter({
  appName,
  filter,
  iconsPath,
}: {
  appName?: string;
  filter: FiltersConfig[number];
  iconsPath?: string;
}) {
  const [open, setOpen] = useState(filter.defaultOpen ?? false);

  const t = useT();
  const filters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);
  const toggleFilter = useUserStore((state) => state.toggleFilter);
  const activeFiltersLength = useMemo(
    () => filter.values.filter((f) => filters.includes(f.id)).length,
    [filters, filter],
  );

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
            {
              "text-muted-foreground": !activeFiltersLength,
            },
          )}
          onClick={() => {
            const newFilters = activeFiltersLength
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
          <span className="font-semibold">
            {t(filter.group) || filter.group}
          </span>
          <span className="ml-1 text-xs text-muted-foreground">
            ({activeFiltersLength}/{filter.values.length})
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
        {filter.values
          .sort((a, b) => (t(a.id) || a.id).localeCompare(t(b.id) || b.id))
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
                    {typeof f.icon === "string" ? (
                      <img
                        alt=""
                        className="h-5 w-5 shrink-0"
                        height={20}
                        src={
                          appName
                            ? getIconsUrl(appName, f.icon, iconsPath)
                            : `/icons/${f.icon}`
                        }
                        width={20}
                      />
                    ) : (
                      <img
                        alt=""
                        className="shrink-0 object-none w-[64px] h-[64px]"
                        src={
                          appName
                            ? getIconsUrl(appName, f.icon.url, iconsPath)
                            : `/icons/${f.icon.url}`
                        }
                        width={f.icon.width}
                        height={f.icon.height}
                        style={{
                          objectPosition: `-${f.icon.x}px -${f.icon.y}px`,
                          zoom: 0.35,
                        }}
                      />
                    )}
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
