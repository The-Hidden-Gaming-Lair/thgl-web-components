import { useUserStore } from "../(providers)";
import { cn, FiltersConfig } from "@repo/lib";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { CollapsibleFilter } from "./collapsible-filter";
import { useT } from "../(providers)";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { FilterSettingsPopover } from "./filter-settings-popover";

export function CollapsibleCategory({
  category,
  filters,
  appName,
  iconsPath,
  forceOpen,
  valueFilter,
}: {
  category: string;
  filters: FiltersConfig;
  appName: string;
  iconsPath?: string;
  forceOpen?: boolean;
  valueFilter?: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  const t = useT();
  const userFilters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);

  const allValueIds = useMemo(
    () => filters.flatMap((f) => f.values.map((v) => v.id)),
    [filters],
  );

  const activeCount = useMemo(
    () => allValueIds.filter((id) => userFilters.includes(id)).length,
    [userFilters, allValueIds],
  );

  const totalCount = allValueIds.length;
  const ratio = totalCount > 0 ? activeCount / totalCount : 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "group flex items-center w-full transition-colors",
          "bg-muted/30 px-1.5 mt-1.5 first:mt-0 rounded-sm",
          { "text-muted-foreground": !activeCount },
        )}
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1.5 text-left transition-colors hover:text-primary py-1.5 px-0.5 truncate grow min-w-0",
              { "text-muted-foreground": !activeCount },
            )}
            title={t(category)}
            type="button"
          >
            <ChevronRight
              className={cn(
                "h-3 w-3 shrink-0 transition-transform duration-200",
                open && "rotate-90",
              )}
            />
            <span className="font-bold text-[11px] uppercase tracking-widest truncate">
              {t(category) || category}
            </span>
            <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
              {activeCount}/{totalCount}
            </span>
          </button>
        </CollapsibleTrigger>
        <button
          className="text-[10px] text-muted-foreground hover:text-primary px-1.5 py-1 transition-colors shrink-0 uppercase tracking-wide"
          onClick={() => {
            const newFilters = activeCount
              ? userFilters.filter((f) => !allValueIds.includes(f))
              : [...new Set([...userFilters, ...allValueIds])];
            setFilters(newFilters);
          }}
          type="button"
          title={
            activeCount
              ? t("myFilters.disableAll", { fallback: "Disable all" })
              : t("myFilters.enableAll", { fallback: "Enable all" })
          }
        >
          {activeCount
            ? t("myFilters.none", { fallback: "None" })
            : t("myFilters.all", { fallback: "All" })}
        </button>
        <FilterSettingsPopover
          isGroup
          groupId={category}
          filterIds={allValueIds}
          filterLabel={t(category) || category}
        />
      </div>
      {/* Progress bar */}
      <div className="h-[2px] bg-muted/20 mx-1.5 overflow-hidden rounded-full">
        <div
          className="h-full bg-primary/50 transition-all duration-300 rounded-full"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <CollapsibleContent>
        <div className="ml-1.5 border-l border-border/25 pl-0.5">
          {filters.map((f) => (
            <CollapsibleFilter
              key={f.group}
              filter={f}
              appName={appName}
              iconsPath={iconsPath}
              forceOpen={forceOpen}
              valueFilter={valueFilter}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
