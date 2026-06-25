import { useUserStore } from "../(providers)";
import { cn, FiltersConfig, getIconsUrl } from "@repo/lib";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { FilterSettingsPopover } from "./filter-settings-popover";
import { useT } from "../(providers)";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";

export function CollapsibleFilter({
  appName,
  filter,
  iconsPath,
  forceOpen,
  valueFilter,
}: {
  appName: string;
  filter: FiltersConfig[number];
  iconsPath?: string;
  forceOpen?: boolean;
  valueFilter?: Set<string>;
}) {
  const [open, setOpen] = useState(filter.defaultOpen ?? false);
  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  const t = useT();
  const filters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);
  const toggleFilter = useUserStore((state) => state.toggleFilter);
  const activeFiltersLength = useMemo(
    () => filter.values.filter((f) => filters.includes(f.id)).length,
    [filters, filter],
  );

  const filterIds = useMemo(
    () => filter.values.map((v) => v.id),
    [filter.values],
  );

  const ratio =
    filter.values.length > 0 ? activeFiltersLength / filter.values.length : 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "group flex items-center transition-colors w-full px-1.5",
          {
            "text-muted-foreground": !activeFiltersLength,
          },
        )}
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1 text-left transition-colors hover:text-primary py-1 px-0.5 truncate grow min-w-0",
              {
                "text-muted-foreground": !activeFiltersLength,
              },
            )}
            title={t(filter.group)}
            type="button"
          >
            <ChevronRight
              className={cn(
                "h-3 w-3 shrink-0 transition-transform duration-200",
                open && "rotate-90",
              )}
            />
            <span className="font-semibold truncate">
              {t(filter.group) || filter.group}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
              {activeFiltersLength}/{filter.values.length}
            </span>
          </button>
        </CollapsibleTrigger>
        <button
          className="text-[10px] text-muted-foreground hover:text-primary px-1.5 py-1 transition-colors shrink-0 uppercase tracking-wide"
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
          type="button"
          title={activeFiltersLength ? "Disable all" : "Enable all"}
        >
          {activeFiltersLength ? "None" : "All"}
        </button>
        <FilterSettingsPopover
          isGroup
          groupId={filter.group}
          filterIds={filterIds}
          filterLabel={t(filter.group) || filter.group}
        />
      </div>
      {/* Progress bar */}
      <div className="h-[2px] bg-muted/20 mx-1.5 overflow-hidden rounded-full">
        <div
          className="h-full bg-primary/50 transition-all duration-300 rounded-full"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <CollapsibleContent className="flex flex-wrap">
        {filter.values
          .filter((v) => !valueFilter || valueFilter.has(v.id))
          .sort((a, b) => {
            if (a.sort !== undefined && b.sort !== undefined) {
              return a.sort - b.sort;
            }
            return (t(a.id) || a.id).localeCompare(t(b.id) || b.id);
          })

          .map((f) => (
            <div
              key={f.id}
              className="flex grow items-center md:basis-1/2 pr-2 min-w-0"
            >
              <Tooltip delayDuration={300} disableHoverableContent>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "flex gap-2 items-center transition-colors hover:text-primary p-2 truncate min-w-0",
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
                        src={getIconsUrl(appName, f.icon, iconsPath)}
                        width={20}
                      />
                    ) : (
                      <img
                        alt=""
                        role="presentation"
                        className="shrink-0 object-none"
                        src={getIconsUrl(appName, f.icon.url, iconsPath)}
                        width={f.icon.width}
                        height={f.icon.height}
                        style={{
                          // width/height in CSS (not just attrs) so the global
                          // `img { height: auto }` preflight can't recompute the
                          // box from the full sheet and clip the wrong cell.
                          width: f.icon.width,
                          height: f.icon.height,
                          objectPosition: `-${f.icon.x}px -${f.icon.y}px`,
                          // Sprite cells are packed at native size now (a cap, not
                          // a fixed 64px), so a fixed zoom rendered small-source
                          // icons (e.g. Lifmunk Effigy, 35px) smaller than their
                          // 64px neighbours. Scale each icon to a uniform ~22px box
                          // by its own width instead.
                          zoom: 22 / (f.icon.width || 64),
                        }}
                      />
                    )}
                    <span className="truncate">{t(f.id) || f.id}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">{t(f.id) || f.id}</TooltipContent>
              </Tooltip>
              <div className="grow" />
              <FilterSettingsPopover
                filterId={f.id}
                filterLabel={t(f.id) || f.id}
                liveOnly={f.live_only}
              />
            </div>
          ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
