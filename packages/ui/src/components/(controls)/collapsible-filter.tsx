import { useUserStore } from "../(providers)";
import {
  cn,
  FiltersConfig,
  getIconsUrl,
  isPreviewFeature,
  previewFilterId,
  useAccountGate,
  useAccountStore,
} from "@repo/lib";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { FilterSettingsPopover } from "./filter-settings-popover";
import { useT } from "../(providers)";
import { useMemo } from "react";
import { ChevronRight, FlaskConical, Lock, PackageSearch } from "lucide-react";
import { PreviewBadge, showPreviewUpsell } from "./preview-badge";
import { LiveOnlyIcon, useLiveOnlyHidden } from "./live-only-hint";
import { NewBadge, useAcknowledgeNewFilters } from "./new-filters";

export function CollapsibleFilter({
  appName,
  filter,
  iconsPath,
  forceOpen,
  valueFilter,
  contentsMatches,
}: {
  appName: string;
  filter: FiltersConfig[number];
  iconsPath?: string;
  forceOpen?: boolean;
  valueFilter?: Set<string>;
  /** Value id → the drop / contents line the search matched (not the name). */
  contentsMatches?: Map<string, string>;
}) {
  const t = useT();
  const filters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);
  const toggleFilter = useUserStore((state) => state.toggleFilter);
  // Filter values in Elite preview (PREVIEW_FEATURES `filter:<app>:<id>`).
  const previewGate = useAccountGate(
    useAccountStore((s) => s.perks.previewReleaseAccess),
  );
  // Open/collapsed is persisted per game (all groups start collapsed on first
  // visit; the user's expansions stick). `forceOpen` (search match) overrides
  // without writing to the store — the search-driven expansion is transient.
  const hasHydrated = useUserStore((state) => state._hasHydrated);
  const openGroups = useUserStore((state) => state.openGroups);
  const setGroupOpen = useUserStore((state) => state.setGroupOpen);
  const open =
    Boolean(forceOpen) || (hasHydrated && openGroups.includes(filter.group));
  const activeFiltersLength = useMemo(
    () => filter.values.filter((f) => filters.includes(f.id)).length,
    [filters, filter],
  );

  const filterIds = useMemo(
    () => filter.values.map((v) => v.id),
    [filter.values],
  );

  // Filters new since the last visit: badged until the group was open.
  const newFilters = useUserStore((state) => state.newFilters);
  const newIds = useMemo(
    () =>
      hasHydrated ? filterIds.filter((id) => newFilters.includes(id)) : [],
    [hasHydrated, filterIds, newFilters],
  );
  useAcknowledgeNewFilters(open, newIds);

  const { hidden: liveOnlyHidden, hint: liveOnlyHint } = useLiveOnlyHidden(
    filter.values,
  );

  const ratio =
    filter.values.length > 0 ? activeFiltersLength / filter.values.length : 0;

  return (
    <Collapsible
      open={open}
      onOpenChange={(o) => setGroupOpen(filter.group, o)}
    >
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
            {liveOnlyHidden.size > 0 && <LiveOnlyIcon hint={liveOnlyHint} />}
            {newIds.length > 0 && <NewBadge />}
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

          .map((f) => {
            const previewId = previewFilterId(appName, f.id);
            const preview = isPreviewFeature(previewId);
            const locked = preview && previewGate === "deny";
            return (
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
                          "text-muted-foreground":
                            locked || !filters.includes(f.id),
                        },
                      )}
                      onClick={() => {
                        if (locked) {
                          showPreviewUpsell(previewId);
                          return;
                        }
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
                      {contentsMatches?.has(f.id) ? (
                        <span className="flex flex-col min-w-0 text-left leading-tight">
                          <span className="truncate">{t(f.id) || f.id}</span>
                          <span className="flex items-center gap-1 text-[11px] text-primary/70 min-w-0">
                            <PackageSearch
                              className="h-3 w-3 shrink-0"
                              aria-hidden
                            />
                            <span className="truncate">
                              {contentsMatches.get(f.id)}
                            </span>
                          </span>
                        </span>
                      ) : (
                        <span className="truncate">{t(f.id) || f.id}</span>
                      )}
                      {f.experimental && (
                        <FlaskConical
                          className="h-3.5 w-3.5 shrink-0 text-amber-500"
                          aria-label={t("filters.experimental")}
                        />
                      )}
                      {locked && (
                        <Lock className="h-3 w-3 shrink-0" aria-hidden />
                      )}
                      {liveOnlyHidden.has(f.id) && (
                        <LiveOnlyIcon
                          hint={liveOnlyHint}
                          className="h-3.5 w-3.5"
                        />
                      )}
                      {preview && <PreviewBadge className="ml-0 shrink-0" />}
                      {newIds.includes(f.id) && <NewBadge />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {t(f.id) || f.id}
                    {contentsMatches?.has(f.id) &&
                      ` · ${contentsMatches.get(f.id)}`}
                    {liveOnlyHidden.has(f.id) && (
                      <span className="block text-orange-500">
                        {liveOnlyHint}
                      </span>
                    )}
                  </TooltipContent>
                </Tooltip>
                <div className="grow" />
                <FilterSettingsPopover
                  filterId={f.id}
                  filterLabel={t(f.id) || f.id}
                  noMapMarkers={f.no_map_markers}
                />
              </div>
            );
          })}
      </CollapsibleContent>
    </Collapsible>
  );
}
