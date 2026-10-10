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
import { LiveOnlyIcon, useLiveOnlyHidden } from "./live-only-hint";
import { NewBadge } from "./new-filters";

export function CollapsibleCategory({
  category,
  filters,
  appName,
  iconsPath,
  forceOpen,
  valueFilter,
  contentsMatches,
}: {
  category: string;
  filters: FiltersConfig;
  appName: string;
  iconsPath?: string;
  forceOpen?: boolean;
  valueFilter?: Set<string>;
  contentsMatches?: Map<string, string>;
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

  const allValues = useMemo(() => filters.flatMap((f) => f.values), [filters]);

  // Groups holding filters new since the last visit. One of them open (the
  // "N new filters" chip opens them) → open the category too, so the badges
  // are on screen.
  const hasHydrated = useUserStore((state) => state._hasHydrated);
  const newFilters = useUserStore((state) => state.newFilters);
  const openGroups = useUserStore((state) => state.openGroups);
  const newGroups = useMemo(
    () =>
      hasHydrated
        ? filters
            .filter((f) => f.values.some((v) => newFilters.includes(v.id)))
            .map((f) => f.group)
        : [],
    [hasHydrated, filters, newFilters],
  );
  const openNewGroup = newGroups.some((group) => openGroups.includes(group));
  useEffect(() => {
    if (openNewGroup) setOpen(true);
  }, [openNewGroup]);
  const { hidden: liveOnlyHidden, hint: liveOnlyHint } =
    useLiveOnlyHidden(allValues);

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
            {liveOnlyHidden.size > 0 && <LiveOnlyIcon hint={liveOnlyHint} />}
            {newGroups.length > 0 && <NewBadge />}
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
              contentsMatches={contentsMatches}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
