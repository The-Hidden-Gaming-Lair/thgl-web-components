"use client";

import {
  cn,
  MIN_SEARCH_QUERY_LENGTH,
  type SearchScope,
  TilesConfig,
  useSettingsStore,
} from "@repo/lib";
import { useUserStore } from "../(providers)";
import { ReactNode, useEffect, useRef, useState, type JSX } from "react";
import { Input } from "../ui/input";
import { MarkersSearchResults } from "./markers-search-results";
import { MarkersFilters } from "./markers-filters";
import { ScrollArea } from "../ui/scroll-area";
import {
  countLiveSearchRows,
  MarkersSearchLiveResults,
  useLiveSearchGroups,
} from "./markers-search-live-results";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  ChevronRight,
  Loader2,
  PanelLeftClose,
  RadioTower,
  Search,
  SlidersHorizontal,
  TriangleAlert,
  UnfoldVertical,
  X,
} from "lucide-react";
import { Separator } from "../ui/separator";
import { MapSelect } from "./map-select";
import { LayerSelect } from "./layer-select";
import { TerraformStageSelect } from "./terraform-stage-select";
import { Presets } from "./presets";
import { GlobalFilters } from "./global-filters";
import { useCoordinates, useT } from "../(providers)";

export function MarkersSearch({
  lastMapUpdate,
  appName,
  children,
  tileOptions,
  additionalFilters,
  embed,
  iconsPath,
  className,
  mapEnTitles,
}: {
  lastMapUpdate?: number;
  appName: string;
  children?: ReactNode;
  tileOptions: TilesConfig;
  additionalFilters?: ReactNode;
  embed?: boolean;
  iconsPath: string;
  className?: string;
  mapEnTitles?: Record<string, string>;
}): JSX.Element {
  const t = useT();
  const {
    _hasHydrated,
    search,
    setSearch,
    searchIsLoading,
    searchScope,
    setSearchScope,
    collapsedSearchScopes,
    setSearchScopeCollapsed,
  } = useUserStore();
  const [internalSearch, setInternalSearch] = useState(search);
  // Only games with a typeIDs bridge can ever have live-tracked actors — no
  // point offering the Live search scope elsewhere. (The guard also covers a
  // persisted "live" scope carried over to a game without live support.)
  const { gameSupportsLive, liveCapable } = useCoordinates();
  const liveScopeActive = searchScope === "live" && gameSupportsLive;
  const queryReady = internalSearch.length >= MIN_SEARCH_QUERY_LENGTH;
  const showFilters = useSettingsStore((state) => state.showFilters);
  const toggleShowFilters = useSettingsStore(
    (state) => state.toggleShowFilters,
  );

  // Which scope's collapse state the results header owns. The two lists differ
  // a lot in length, so they are remembered independently.
  const resultsScope: SearchScope = liveScopeActive ? "live" : "historical";
  // Default OPEN; `collapsedSearchScopes` records the exceptions. The
  // `_hasHydrated` guard mirrors collapsible-filter.tsx: before localStorage is
  // read the array is always empty, so without it the first paint would say
  // "open" and then snap shut — a hydration mismatch.
  const resultsOpen =
    !_hasHydrated || !collapsedSearchScopes.includes(resultsScope);

  // Lifted out of MarkersSearchLiveResults so the header can show the row
  // count without walking the (potentially huge) actor list a second time.
  // Gated so its 1Hz snapshot interval doesn't tick on every page with a
  // sidebar; it returns [] whenever it is disabled.
  const liveGroups = useLiveSearchGroups(
    internalSearch,
    liveScopeActive && queryReady,
  );
  const liveRowCount = countLiveSearchRows(liveGroups);

  // Only TOP-LEVEL maps in the main selector — interior floors (tagged with
  // `layer`) are chosen in the separate Layered Map picker instead.
  const mapNames = Object.entries(tileOptions)
    .filter(([, v]) => !v.layer)
    .map(([k, v]) => ({
      name: k,
      defaultTitle: v.defaultTitle || mapEnTitles?.[k] || t(k),
    }));
  const hasLayers = Object.values(tileOptions).some((v) => v.layer);

  useEffect(() => {
    if (_hasHydrated) {
      setInternalSearch(search);
    }
  }, [_hasHydrated]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(internalSearch);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [internalSearch]);
  const isLoading = searchIsLoading || search !== internalSearch;

  // Mobile: collapse filters on first render
  const mobileInitRef = useRef(false);
  useEffect(() => {
    if (mobileInitRef.current || embed) return;
    mobileInitRef.current = true;
    if (window.matchMedia("(max-width: 767px)").matches && showFilters) {
      toggleShowFilters();
    }
  }, [_hasHydrated]);

  const panelVisible = showFilters;

  return (
    <>
      {/* Floating filter toggle when panel is hidden */}
      <button
        className={cn(
          "fixed top-[64px] left-2 z-500 h-8 px-3 rounded-md border border-input bg-background shadow-sm flex items-center gap-1.5 text-xs font-medium cursor-pointer hover:bg-accent transition-all",
          panelVisible && "opacity-0 pointer-events-none",
          embed && "hidden",
          className,
        )}
        onClick={toggleShowFilters}
        type="button"
        aria-label={t("markers.filters.toggleShow")}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        {t("markers.filters.label")}
      </button>

      <div
        className={cn(
          `fixed w-[200px] md:w-[300px] lg:w-[363px] top-[64px] z-500 pointer-events-none flex flex-col gap-1 select-none`,
          `bottom-[60px] h-[calc(100vh-134px)] md:bottom-2 md:h-[calc(100vh-74px)]`,
          `transition-[left] duration-200`,
          panelVisible ? "left-2" : "left-[calc(-100%-8px)]",
          { "top-2 md:ml-0 h-screen": embed },
          className,
        )}
      >
        <div
          className={cn(
            "relative flex w-full items-stretch pointer-events-auto bg-card border border-input rounded-md shadow-xs",
            "transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
          )}
        >
          {/* Same subtle tint the standalone Input carries (bg-input/30). */}
          <div
            className="pointer-events-none absolute inset-0 rounded-md bg-input/30"
            aria-hidden
          />
          <div className="relative grow">
            {/* Leading search icon, swaps to a spinner while a query is in flight */}
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-muted-foreground">
              {isLoading && queryReady ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </div>
            <Input
              autoComplete="off"
              autoCorrect="off"
              className="pl-8 pr-7 border-0 bg-transparent shadow-none rounded-none rounded-l-md focus-visible:ring-0 focus-visible:border-0"
              onChange={(event) => {
                setInternalSearch(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setInternalSearch("");
                  event.currentTarget.blur();
                }
              }}
              placeholder={t("markers.search.placeholder")}
              type="text"
              value={internalSearch}
            />
            {internalSearch ? (
              <button
                aria-label={t("markers.search.clear")}
                className="flex absolute inset-y-0 right-0 items-center px-1.5 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  setInternalSearch("");
                }}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          {gameSupportsLive && (
            <>
              <div className="my-2 w-px bg-border" aria-hidden />
              {/* Search-scope switch: historical spawn locations vs live
                  tracked actors. Independent of the global live mode. */}
              <button
                aria-checked={searchScope === "live"}
                className={cn(
                  "flex items-center gap-1 px-2 text-xs transition-colors",
                  searchScope === "live"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => {
                  setSearchScope(
                    searchScope === "live" ? "historical" : "live",
                  );
                }}
                role="switch"
                title={t("markers.search.scopeHint")}
                type="button"
              >
                <RadioTower className="h-3.5 w-3.5" />
                {t("markers.search.scopeLive")}
              </button>
            </>
          )}
          <div className="my-2 w-px bg-border" aria-hidden />
          <button
            aria-expanded={showFilters}
            aria-haspopup="menu"
            aria-label={
              showFilters
                ? t("markers.filters.toggleHide")
                : t("markers.filters.toggleShow")
            }
            className="flex items-center px-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={toggleShowFilters}
            type="button"
          >
            {showFilters ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <UnfoldVertical className="h-4 w-4" />
            )}
          </button>
        </div>
        <div
          className={cn(
            "pointer-events-auto border rounded-md bg-card text-card-foreground shadow relative pb-1 overflow-hidden text-sm flex flex-col",
            {
              collapse: !showFilters,
            },
          )}
        >
          {lastMapUpdate && (
            <div className="text-[10px] text-muted-foreground px-2.5 py-1 uppercase tracking-wide">
              {t("markers.search.update")}{" "}
              <span className="tabular-nums">
                {new Date(lastMapUpdate).toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
          {additionalFilters && (
            <div className="shrink-0 max-h-[50%] overflow-hidden flex flex-col">
              <ScrollArea type="auto">{additionalFilters}</ScrollArea>
              <Separator />
            </div>
          )}
          {(mapNames.length > 1 || hasLayers) && (
            <div className="shrink-0">
              <div className="flex items-center">
                <div className="flex-1 min-w-0">
                  <MapSelect mapNames={mapNames} tileOptions={tileOptions} />
                </div>
                {/* Layered Map picker — only appears where interiors exist. */}
                <LayerSelect tileOptions={tileOptions} />
                {/* Terraform-stage backdrop picker — only where a map has `.stages`. */}
                <TerraformStageSelect tileOptions={tileOptions} />
              </div>
              <Separator />
            </div>
          )}
          <div className="shrink-0">
            <Presets />
            <Separator />
            <GlobalFilters />
          </div>
          <ScrollArea type="auto" className="min-h-0">
            {/* One query drives BOTH sections: the marker results (historical
                spawn locations or live actors, per the scope switch) on top,
                and the filtered filter list with its toggles below. */}
            {internalSearch.trim() ? (
              // The results block collapses like a filter group, so a broad
              // query (live scope can match dozens of types) never pushes the
              // filter toggles below the fold. Default open, per-scope
              // collapse persisted in the user store.
              <Collapsible
                open={resultsOpen}
                onOpenChange={(open) => {
                  setSearchScopeCollapsed(resultsScope, !open);
                }}
                data-testid="search-results-section"
              >
                <CollapsibleTrigger asChild>
                  <button
                    className="flex w-full items-center gap-1.5 px-2.5 pt-1.5 pb-0.5 text-left text-[10px] uppercase tracking-wider text-muted-foreground/80 transition-colors hover:text-primary"
                    title={
                      liveScopeActive
                        ? t("markers.search.liveResults")
                        : t("markers.search.locations")
                    }
                    type="button"
                  >
                    <ChevronRight
                      className={cn(
                        "h-3 w-3 shrink-0 transition-transform duration-200",
                        resultsOpen && "rotate-90",
                      )}
                    />
                    <span className="truncate">
                      {liveScopeActive
                        ? t("markers.search.liveResults")
                        : t("markers.search.locations")}
                    </span>
                    {/* Collapsed, the count is the only signal that the query
                        matched anything at all. Not without live capability:
                        "(0)" would claim "no match" where the real answer is
                        "needs the app". */}
                    {liveScopeActive && queryReady && liveCapable && (
                      <span className="tabular-nums text-muted-foreground shrink-0">
                        ({liveRowCount})
                      </span>
                    )}
                  </button>
                </CollapsibleTrigger>
                {/* Not a result row, so it stays visible while collapsed. */}
                {!queryReady && (
                  <div className="p-2 text-center text-xs text-muted-foreground">
                    <TriangleAlert className="w-4 h-4 mx-auto" />
                    {t("markers.search.moreCharacters")}
                  </div>
                )}
                <CollapsibleContent>
                  {!queryReady ? null : liveScopeActive ? (
                    <MarkersSearchLiveResults
                      hasMultipleMaps={mapNames.length > 1}
                      appName={appName}
                      iconsPath={iconsPath}
                      groups={liveGroups}
                      query={internalSearch}
                    />
                  ) : isLoading ? (
                    <div className="p-2 text-center">
                      <Search className="w-4 h-4 mx-auto" />
                      {t("markers.search.searching")}
                    </div>
                  ) : (
                    <MarkersSearchResults
                      hasMultipleMaps={mapNames.length > 1}
                      appName={appName}
                      iconsPath={iconsPath}
                    />
                  )}
                </CollapsibleContent>
                {/* Outside the content: the boundary between results and
                    filters is still drawn while the section is shut. */}
                <Separator className="my-1" />
              </Collapsible>
            ) : null}
            <MarkersFilters
              appName={appName}
              iconsPath={iconsPath}
              query={internalSearch}
            />
          </ScrollArea>
        </div>
        <div className="grow" />
        {children}
      </div>
    </>
  );
}
