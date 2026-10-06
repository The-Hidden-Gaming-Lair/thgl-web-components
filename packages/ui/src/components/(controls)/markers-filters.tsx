"use client";
import { useMemo, type JSX } from "react";
import { FiltersConfig } from "@repo/lib";
import { useCoordinates, useT } from "../(providers)";
import { MyFilters } from "./my-filters";
import { CollapsibleFilter } from "./collapsible-filter";
import { CollapsibleCategory } from "./collapsible-category";
import { RegionFilters } from "./region-filters";
import { PalCaptureFilters } from "./pal-capture-filters";

type FilterEntry =
  | { type: "filter"; filter: FiltersConfig[number] }
  | { type: "category"; category: string; filters: FiltersConfig };

type FilteredEntry = {
  entry: FilterEntry;
  valueFilter: Set<string> | null;
};

/** Below this length a query only matches names (descriptions are too noisy). */
const MIN_CONTENTS_QUERY = 3;

/**
 * The line of a value's tags / description that matches the query, e.g. the
 * "Sunstone (Rare)" drop of a Jadium node when searching "sunstone".
 */
function findContentsMatch(
  t: ReturnType<typeof useT>,
  id: string,
  q: string,
): string | undefined {
  const tagsKey = `${id}_tags`;
  const tags = t(tagsKey);
  const texts = [tags === tagsKey ? "" : tags, t(id, { isDesc: true })];
  for (const text of texts) {
    if (!text) continue;
    const hit = text
      .replace(/{{.*?}}/g, "")
      .replace(/<[^>]*>/g, "\n")
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .find((s) => s.toLowerCase().includes(q));
    if (hit) return hit.length > 40 ? hit.slice(0, 39) + "…" : hit;
  }
  return undefined;
}

export function MarkersFilters({
  appName,
  iconsPath,
  query,
}: {
  appName: string;
  iconsPath?: string;
  /**
   * Filter query from the unified sidebar search bar (owned by MarkersSearch,
   * un-debounced so the list filters instantly while typing).
   */
  query: string;
}): JSX.Element {
  const { filters: filterDetails } = useCoordinates();
  const t = useT();
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

  const { filteredEntries, contentsMatches } = useMemo(() => {
    const contentsMatches = new Map<string, string>();
    if (!trimmedQuery) {
      return {
        filteredEntries: entries.map(
          (entry): FilteredEntry => ({ entry, valueFilter: null }),
        ),
        contentsMatches,
      };
    }
    const q = trimmedQuery;
    // Values whose name matches, else whose tags / description (drops,
    // contents) mention the query — those get the matched line as a hint.
    const matchValues = (f: FiltersConfig[number]) =>
      f.values.filter((v) => {
        if ((t(v.id) || v.id).toLowerCase().includes(q)) return true;
        if (q.length < MIN_CONTENTS_QUERY) return false;
        const hit = findContentsMatch(t, v.id, q);
        if (hit) contentsMatches.set(v.id, hit);
        return !!hit;
      });
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
          const matchingValues = matchValues(f);
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
        const matchingValues = matchValues(f);
        if (matchingValues.length) {
          result.push({
            entry,
            valueFilter: new Set(matchingValues.map((v) => v.id)),
          });
        }
      }
    }
    return { filteredEntries: result, contentsMatches };
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
      {isFiltering && (
        <div className="border-b border-border/40 px-2 py-1 text-[10px] uppercase tracking-wider tabular-nums text-muted-foreground/60">
          {visibleGroups === 0
            ? t("markers.filters.noMatch", { vars: { query } })
            : t.rich("markers.filters.matchCount", {
                components: {
                  visible: (
                    <span className="text-primary/80">{visibleGroups}</span>
                  ),
                  total: <>{totalGroups}</>,
                },
              })}
        </div>
      )}

      {!isFiltering && (
        <>
          <MyFilters />
          <RegionFilters />
          {appName === "palworld" && <PalCaptureFilters />}
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
              contentsMatches={contentsMatches}
            />
          ) : (
            <CollapsibleFilter
              key={entry.filter.group}
              filter={entry.filter}
              appName={appName}
              iconsPath={iconsPath}
              forceOpen={isFiltering}
              valueFilter={valueFilter ?? undefined}
              contentsMatches={contentsMatches}
            />
          ),
        )}
      </div>
    </>
  );
}
