"use client";
import { useMemo, useState, type JSX } from "react";
import { cn, FiltersConfig } from "@repo/lib";
import { useCoordinates, useT } from "../(providers)";
import { MyFilters } from "./my-filters";
import { CollapsibleFilter } from "./collapsible-filter";
import { CollapsibleCategory } from "./collapsible-category";
import { RegionFilters } from "./region-filters";
import { ListFilter, X } from "lucide-react";

type FilterEntry =
  | { type: "filter"; filter: FiltersConfig[number] }
  | { type: "category"; category: string; filters: FiltersConfig };

type FilteredEntry = {
  entry: FilterEntry;
  valueFilter: Set<string> | null;
};

export function MarkersFilters({
  appName,
  iconsPath,
}: {
  appName: string;
  iconsPath?: string;
}): JSX.Element {
  const { filters: filterDetails } = useCoordinates();
  const t = useT();
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim().toLowerCase();

  const entries = useMemo(() => {
    const result: FilterEntry[] = [];
    const categoryMap = new Map<string, FiltersConfig>();
    const categoryOrder: string[] = [];

    for (const f of filterDetails) {
      if (f.category) {
        if (!categoryMap.has(f.category)) {
          categoryMap.set(f.category, []);
          categoryOrder.push(f.category);
        }
        categoryMap.get(f.category)!.push(f);
      }
    }

    const emittedCategories = new Set<string>();
    for (const f of filterDetails) {
      if (f.category) {
        if (!emittedCategories.has(f.category)) {
          emittedCategories.add(f.category);
          result.push({
            type: "category",
            category: f.category,
            filters: categoryMap.get(f.category)!,
          });
        }
      } else {
        result.push({ type: "filter", filter: f });
      }
    }

    return result;
  }, [filterDetails]);

  const filteredEntries: FilteredEntry[] = useMemo(() => {
    if (!trimmedQuery) {
      return entries.map((entry) => ({ entry, valueFilter: null }));
    }
    const q = trimmedQuery;
    const result: FilteredEntry[] = [];
    for (const entry of entries) {
      if (entry.type === "category") {
        const categoryName = (
          t(entry.category) || entry.category
        ).toLowerCase();
        if (categoryName.includes(q)) {
          result.push({ entry, valueFilter: null });
          continue;
        }
        const innerMatchedGroups: FiltersConfig = [];
        const innerValueFilter = new Set<string>();
        let anyValueOnlyMatch = false;
        for (const f of entry.filters) {
          const groupName = (t(f.group) || f.group).toLowerCase();
          if (groupName.includes(q)) {
            innerMatchedGroups.push(f);
            continue;
          }
          const matchingValues = f.values.filter((v) =>
            (t(v.id) || v.id).toLowerCase().includes(q),
          );
          if (matchingValues.length) {
            innerMatchedGroups.push(f);
            matchingValues.forEach((v) => innerValueFilter.add(v.id));
            anyValueOnlyMatch = true;
          }
        }
        if (innerMatchedGroups.length) {
          result.push({
            entry: { ...entry, filters: innerMatchedGroups },
            valueFilter: anyValueOnlyMatch ? innerValueFilter : null,
          });
        }
      } else {
        const f = entry.filter;
        const groupName = (t(f.group) || f.group).toLowerCase();
        if (groupName.includes(q)) {
          result.push({ entry, valueFilter: null });
          continue;
        }
        const matchingValues = f.values.filter((v) =>
          (t(v.id) || v.id).toLowerCase().includes(q),
        );
        if (matchingValues.length) {
          result.push({
            entry,
            valueFilter: new Set(matchingValues.map((v) => v.id)),
          });
        }
      }
    }
    return result;
  }, [entries, trimmedQuery, t]);

  const totalGroups = useMemo(
    () =>
      entries.reduce(
        (acc, e) => acc + (e.type === "category" ? e.filters.length : 1),
        0,
      ),
    [entries],
  );
  const visibleGroups = useMemo(
    () =>
      filteredEntries.reduce(
        (acc, e) =>
          acc + (e.entry.type === "category" ? e.entry.filters.length : 1),
        0,
      ),
    [filteredEntries],
  );

  const isFiltering = trimmedQuery.length > 0;

  return (
    <>
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/40 px-1.5 pt-1.5 pb-1">
        <div
          className={cn(
            "relative flex items-center h-7 rounded-sm border transition-colors",
            isFiltering
              ? "border-primary/50 bg-input/30"
              : "border-input/40 bg-input/30 focus-within:border-ring",
          )}
        >
          <ListFilter
            className={cn(
              "h-3.5 w-3.5 ml-2 shrink-0 transition-colors",
              isFiltering ? "text-primary" : "text-muted-foreground",
            )}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("markers.filters.find")}
            className="grow bg-transparent px-2 text-xs outline-none placeholder:text-muted-foreground/60"
            autoComplete="off"
            autoCorrect="off"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              type="button"
              className="mr-1 p-1 text-muted-foreground hover:text-primary transition-colors"
              aria-label={t("markers.filters.clear")}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        {isFiltering && (
          <div className="mt-1 px-0.5 text-[10px] uppercase tracking-wider tabular-nums text-muted-foreground/80">
            {visibleGroups === 0 ? (
              <span className="text-muted-foreground/60">
                {t("markers.filters.noMatch", { vars: { query } })}
              </span>
            ) : (
              <span className="text-muted-foreground/60">
                {t.rich("markers.filters.matchCount", {
                  components: {
                    visible: (
                      <span className="text-primary/80">{visibleGroups}</span>
                    ),
                    total: <>{totalGroups}</>,
                  },
                })}
              </span>
            )}
          </div>
        )}
      </div>

      {!isFiltering && (
        <>
          <MyFilters />
          <RegionFilters />
        </>
      )}
      <div className="flex flex-col w-[200px] md:w-[300px] lg:w-full">
        {filteredEntries.map(({ entry, valueFilter }) =>
          entry.type === "category" ? (
            <CollapsibleCategory
              key={entry.category}
              category={entry.category}
              filters={entry.filters}
              appName={appName}
              iconsPath={iconsPath}
              forceOpen={isFiltering}
              valueFilter={valueFilter ?? undefined}
            />
          ) : (
            <CollapsibleFilter
              key={entry.filter.group}
              filter={entry.filter}
              appName={appName}
              iconsPath={iconsPath}
              forceOpen={isFiltering}
              valueFilter={valueFilter ?? undefined}
            />
          ),
        )}
      </div>
    </>
  );
}
