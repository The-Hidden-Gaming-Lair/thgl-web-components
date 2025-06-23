"use client";

import {
  cn,
  FiltersConfig,
  GlobalFiltersConfig,
  RegionsConfig,
  THGLAppConfig,
  TilesConfig,
  useSettingsStore,
  Version,
} from "@repo/lib";
import {
  CoordinatesProvider,
  Dict,
  I18NProvider,
  TooltipProvider,
} from "../(providers)";
import {
  Button,
  ErrorBoundary,
  MarkersSearch,
  Toaster,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../(controls)";
import { AppHeader } from "./app-header";
import { OverlayInputEvents } from "./overlay-input-events";
import { AppMapDynamic } from "./app-map-dynamic";
import { InitializeApp } from "./initialize-app";
import { ResizeBorders } from "./resize-borders";
import { HeaderSwitch } from "../(header)";
import { EyeNoneIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import { UnlockButton } from "./unlock-button";
import { MapHotkeys } from "./map-hotkeys";
import { THGLAppSettingsDialogContent } from "./settings-dialog-content";
import { THGLMapAds } from "../(ads)";

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
}: {
  appConfig: THGLAppConfig;
  dict: Dict;
  tiles: TilesConfig;
  regions: RegionsConfig;
  typesIdMap?: Record<string, string>;
  filters: FiltersConfig;
  lockedWindowComponents?: React.ReactNode;
  additionalComponents?: React.ReactNode;
  globalFilters?: GlobalFiltersConfig;
  additionalFilters?: React.ReactNode;
  version: Version;
  isOverlay?: boolean;
}) {
  const liveMode = useSettingsStore((state) => state.liveMode);
  const toggleLiveMode = useSettingsStore((state) => state.toggleLiveMode);
  const lockedWindow = useSettingsStore((state) => state.lockedWindow);
  const overlayMode = useSettingsStore((state) => state.overlayMode);
  const setOverlayMode = useSettingsStore((state) => state.setOverlayMode);
  const toggleLockedWindow = useSettingsStore(
    (state) => state.toggleLockedWindow,
  );

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
            typesIdMap={typesIdMap}
            globalFilters={globalFilters}
            useCbor
            nodesPaths={version?.more.nodes}
          >
            {lockedWindow ? (
              <UnlockButton onClick={toggleLockedWindow} />
            ) : (
              <AppHeader
                isOverlay={isOverlay}
                settingsDialogContent={
                  <THGLAppSettingsDialogContent appConfig={appConfig} />
                }
              >
                <h1 className="text-lg md:leading-6 font-extrabold tracking-tight whitespace-nowrap">
                  <span className="uppercase">{appConfig.domain}</span>
                  <span className="text-xs text-gray-400 hidden min-[410px]:inline">
                    .TH.GL
                  </span>
                </h1>
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
                    <div>
                      <HeaderSwitch
                        checked={!overlayMode}
                        label="2nd Screen Mode"
                        labelClassName="hidden md:inline-flex"
                        onChange={(checked) => {
                          setOverlayMode(!checked);
                        }}
                        disabled={appConfig.withoutOverlayMode}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="w-64" side="bottom">
                    <p>
                      Switch between 2nd screen mode and overlay mode. The
                      overlay mode requires that the game is running.
                    </p>
                    {appConfig.withoutOverlayMode && (
                      <p className="text-red-500">
                        The overlay mode is not supported for this game.
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={200} disableHoverableContent>
                  <TooltipTrigger asChild>
                    <div>
                      <HeaderSwitch
                        checked={liveMode}
                        label="Live Mode"
                        labelClassName="hidden md:inline-flex"
                        onChange={toggleLiveMode}
                        disabled={appConfig.withoutLiveMode}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="w-64" side="bottom">
                    <p>
                      The live mode shows the current locations of some nodes on
                      the map in a limited range. Disable it to see the spawn
                      locations instead. Check the filter tooltip for the live
                      mode support.
                    </p>
                    {appConfig.withoutLiveMode && (
                      <p className="text-red-500">
                        The live mode is not supported for this game.
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </AppHeader>
            )}
            <div
              className={cn("relative h-dscreen lock", {
                "pt-[32px]": !Boolean(isOverlay) && !lockedWindow,
              })}
            >
              <ErrorBoundary>
                <AppMapDynamic
                  appConfig={appConfig}
                  version={version}
                  isOverlay={Boolean(isOverlay)}
                  tileOptions={tiles}
                  lockedWindow={lockedWindow}
                />
                {!lockedWindow && (
                  <MarkersSearch
                    lastMapUpdate={version.createdAt}
                    tileOptions={tiles}
                    appName={appConfig.name}
                    additionalFilters={additionalFilters}
                    iconsPath={version?.more.icons}
                    className="top-[40px] md:ml-0"
                  />
                )}
                {lockedWindow ? lockedWindowComponents : null}
                {additionalComponents}
              </ErrorBoundary>
            </div>
            <MapHotkeys />
            {isOverlay && <OverlayInputEvents />}
          </CoordinatesProvider>
        </TooltipProvider>
      </I18NProvider>
      {!isOverlay && <ResizeBorders />}
      <THGLMapAds isOverlay={isOverlay} appConfig={appConfig} />
      <Toaster />
    </div>
  );
}
