"use client";

import {
  cn,
  Dict,
  FiltersConfig,
  games,
  GlobalFiltersConfig,
  RegionsConfig,
  THGLAppConfig,
  TilesConfig,
  translate,
  isPreviewReleaseApp,
  useAccountStore,
  useOverlayMapHidden,
  useSettingsStore,
  Version,
} from "@repo/lib";
import {
  useLiveState,
  setWindowMode as setWindowModeNative,
  WindowMode,
} from "@repo/lib/thgl-app";
import {
  CoordinatesProvider,
  I18NProvider,
  TooltipProvider,
} from "../(providers)";
import {
  Button,
  ErrorBoundary,
  LiveModeControl,
  OverlayMapHiddenPill,
  Toaster,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../(controls)";
import { MarkersSearch } from "../(controls)/markers-search";
import { AppHeader } from "./app-header";
import { PreviewReleaseGate } from "./preview-release-gate";
import { GameSwitcher } from "../(header)/game-switcher";
import { StatusBanner } from "../(header)/status-banner";
import { ExclusiveFullscreenDialog } from "./exclusive-fullscreen-dialog";
import { OverlayInputEvents } from "./overlay-input-events";
import { AppMapDynamic } from "./app-map-dynamic";
import { InitializeApp } from "./initialize-app";
import { ResizeBorders } from "./resize-borders";
import { EyeNoneIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import { UnlockButton } from "./unlock-button";
import { MapHotkeys } from "./map-hotkeys";
import { THGLAppSettingsDialogContent } from "./settings-dialog-content";
import { THGLMapAds } from "../(ads)";
import { AdditionalTooltipType } from "../(content)";
import { MarkerPanel, ZoneDetailsPanel } from "../(data)";
import { ActorTypeFilter } from "./actor-type-filter";
import { useMemo } from "react";

// Pre-release ("preview") games are Elite-only across the in-game app AND the web
// map/db pages — the shared list + helper live in @repo/lib (isPreviewReleaseApp).

export function App({
  appConfig,
  dict,
  filters,
  tiles,
  typesIdMap,
  regions,
  additionalFilters,
  lockedWindowComponents,
  additionalComponents,
  globalFilters,
  version,
  isOverlay,
  additionalTooltip,
}: {
  appConfig: THGLAppConfig;
  dict: Dict;
  tiles: TilesConfig;
  regions: RegionsConfig;
  typesIdMap: Record<string, string>;
  filters: FiltersConfig;
  lockedWindowComponents?: React.ReactNode;
  additionalComponents?: React.ReactNode;
  globalFilters?: GlobalFiltersConfig;
  additionalFilters?: React.ReactNode;
  version: Version;
  isOverlay?: boolean;
  additionalTooltip?: AdditionalTooltipType;
}) {
  const lockedWindow = useSettingsStore((state) => state.lockedWindow);
  const toggleLockedWindow = useSettingsStore(
    (state) => state.toggleLockedWindow,
  );
  const windowMode = useLiveState((state) => state.windowMode);
  const setWindowMode = useLiveState((state) => state.setWindowMode);
  // Per-map overlay auto-hide — the hook must stay mounted even while hidden
  // (it tracks player.mapName and feeds the hotkey override).
  const { hidden: overlayMapHidden } = useOverlayMapHidden();
  const hasPreviewAccess = useAccountStore(
    (state) => state.perks.previewReleaseAccess,
  );
  const fullTypesIdMap = useMemo(() => {
    if (appConfig.name === "dune-awakening" && hasPreviewAccess) {
      return {
        ...typesIdMap,
      };
    }
    return typesIdMap;
  }, [appConfig.name, hasPreviewAccess, typesIdMap]);
  const withoutLiveMode = useMemo(
    () => Object.keys(fullTypesIdMap).length === 0,
    [fullTypesIdMap],
  );

  // Elite Supporter preview gate for preview-only games without Preview Release
  // Access: the full app shell + header stay (window mode, live mode, settings,
  // window controls) — only the map CONTENT below is replaced by the upsell.
  const isPreviewLocked =
    isPreviewReleaseApp(appConfig.name) && !hasPreviewAccess;

  return (
    <div
      className={cn(
        "font-sans min-h-dscreen text-white antialiased select-none overflow-hidden w-full",
        !isOverlay ? "bg-black" : "bg-transparent",
        {
          locked: isOverlay && lockedWindow,
        },
      )}
    >
      <InitializeApp />
      <I18NProvider dict={dict}>
        <TooltipProvider>
          <CoordinatesProvider
            appName={appConfig.name}
            filters={filters}
            mapNames={Object.keys(tiles)}
            regions={regions}
            typesIdMap={fullTypesIdMap}
            globalFilters={globalFilters}
            useCbor
            nodesPaths={version.more.nodes}
            staticDrawings={version.data.drawings}
            clusterPrecision={appConfig.markerOptions.clusterPrecision}
            inGameCoordinates={
              games.find((g) => g.id === appConfig.name)?.inGameCoordinates
            }
          >
            {/* Inside CoordinatesProvider: reads the user's enabled filters so the
                native reader only scans/serializes the types actually in use. */}
            <ActorTypeFilter typesIdMap={fullTypesIdMap} />
            {lockedWindow ? (
              <UnlockButton onClick={toggleLockedWindow} />
            ) : (
              <AppHeader
                isOverlay={isOverlay}
                title={<GameSwitcher activeApp={appConfig.title} compact />}
                settingsDialogContent={
                  <THGLAppSettingsDialogContent
                    appConfig={appConfig}
                    filters={filters}
                  />
                }
              >
                <Button
                  onClick={toggleLockedWindow}
                  size="xs"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {lockedWindow ? <EyeOpenIcon /> : <EyeNoneIcon />}
                  <span className="ml-1 hidden md:block">Hide Controls</span>
                </Button>

                <Tooltip delayDuration={200} disableHoverableContent>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      <div className="flex rounded-md overflow-hidden border border-gray-600">
                        <button
                          className={cn(
                            "px-2 py-0.5 text-xs transition-colors",
                            windowMode === "overlay"
                              ? "bg-primary text-primary-foreground"
                              : "bg-gray-800 hover:bg-gray-700 text-gray-300",
                          )}
                          onClick={() => {
                            setWindowMode("overlay");
                            setWindowModeNative("overlay").catch(console.error);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          disabled={appConfig.withoutOverlayMode}
                        >
                          Overlay
                        </button>
                        <button
                          className={cn(
                            "px-2 py-0.5 text-xs transition-colors border-x border-gray-600",
                            windowMode === "desktop"
                              ? "bg-primary text-primary-foreground"
                              : "bg-gray-800 hover:bg-gray-700 text-gray-300",
                          )}
                          onClick={() => {
                            setWindowMode("desktop");
                            setWindowModeNative("desktop").catch(console.error);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          Desktop
                        </button>
                        <button
                          className={cn(
                            "px-2 py-0.5 text-xs transition-colors",
                            windowMode === "both"
                              ? "bg-primary text-primary-foreground"
                              : "bg-gray-800 hover:bg-gray-700 text-gray-300",
                          )}
                          onClick={() => {
                            setWindowMode("both");
                            setWindowModeNative("both").catch(console.error);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          disabled={appConfig.withoutOverlayMode}
                        >
                          Both
                        </button>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="w-64" side="bottom">
                    <p>
                      <strong>Overlay:</strong> Shows map overlay on top of the
                      game.
                    </p>
                    <p className="mt-1">
                      <strong>Desktop:</strong> Opens in a separate window (2nd
                      screen).
                    </p>
                    <p className="mt-1">
                      <strong>Both:</strong> Opens both overlay and desktop
                      window.
                    </p>
                    {appConfig.withoutOverlayMode && (
                      <p className="text-red-500 mt-1">
                        The overlay mode is not supported for this game.
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={200} disableHoverableContent>
                  <TooltipTrigger asChild>
                    <div>
                      <LiveModeControl disabled={withoutLiveMode} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="w-64" side="bottom">
                    <p>
                      The live mode shows the current locations of some nodes on
                      the map in a limited range. Disable it to see the spawn
                      locations instead. Check the filter tooltip for the live
                      mode support.
                    </p>
                    {withoutLiveMode && (
                      <p className="text-red-500">
                        The live mode is not supported for this game.
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </AppHeader>
            )}
            {/* Companion-app webview surface — the 2026-07-27 outage hit
                exactly these users with zero in-app signal. Overlaid below
                the 32px header so the map never shifts; suppressed in
                overlay mode (screen real estate over the game). */}
            {!isOverlay && !lockedWindow && (
              // z-600: above the map controls (filters/actions are z-500)
              // which otherwise paint over the banner (later in DOM).
              <div className="absolute top-[32px] inset-x-0 z-600">
                <StatusBanner game={appConfig.name} surface="thgl-app" />
              </div>
            )}
            <div
              className={cn("relative h-dscreen lock", {
                "pt-[32px]": !Boolean(isOverlay) && !lockedWindow,
              })}
            >
              <ErrorBoundary>
                {isOverlay && overlayMapHidden ? (
                  <OverlayMapHiddenPill />
                ) : (
                  <>
                    <AppMapDynamic
                      appConfig={appConfig}
                      version={version}
                      isOverlay={Boolean(isOverlay)}
                      tileOptions={tiles}
                      lockedWindow={lockedWindow}
                      additionalTooltip={additionalTooltip}
                      withoutLiveMode={withoutLiveMode}
                    />
                    {!lockedWindow && (
                      <MarkersSearch
                        lastMapUpdate={version.createdAt}
                        tileOptions={tiles}
                        appName={appConfig.name}
                        additionalFilters={additionalFilters}
                        iconsPath={version?.more.icons}
                        className="top-[40px] md:ml-0"
                        mapEnTitles={Object.fromEntries(
                          Object.keys(tiles).map((k) => [
                            k,
                            translate(dict, k),
                          ]),
                        )}
                      />
                    )}
                    {lockedWindow ? lockedWindowComponents : null}
                    {additionalComponents}
                    {!lockedWindow && (
                      <>
                        <MarkerPanel
                          appName={appConfig.name}
                          additionalTooltip={additionalTooltip}
                          coordinateCopyFormat={
                            appConfig.markerOptions.coordinateCopyFormat
                          }
                          headerOffset="32px"
                        />
                        <ZoneDetailsPanel appName={appConfig.name} />
                      </>
                    )}
                  </>
                )}
              </ErrorBoundary>
            </div>
            {/* Elite Supporter paywall over the full app — non-modal so the
                header, hotkeys and the window-unlock button stay functional. */}
            {isPreviewLocked && (
              <PreviewReleaseGate
                title={appConfig.title}
                isOverlay={Boolean(isOverlay)}
              />
            )}
            <MapHotkeys tilesConfig={tiles} />
            {isOverlay && <OverlayInputEvents />}
            {isOverlay && <ExclusiveFullscreenDialog />}
          </CoordinatesProvider>
        </TooltipProvider>
      </I18NProvider>
      {!isOverlay && <ResizeBorders />}
      <THGLMapAds isOverlay={isOverlay} appConfig={appConfig} />
      <Toaster />
    </div>
  );
}
