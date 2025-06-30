import {
  cn,
  DrawingsConfig,
  FiltersConfig,
  GlobalFiltersConfig,
  OverwolfAppConfig,
  RegionsConfig,
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
import { useOverwolfState } from "@repo/lib/overwolf";
import { AppHeader } from "./app-header";
import { HeaderOffset, PlausibleTracker } from "../(header)";
import { MapContainer } from "./map-container";
import {
  InteractiveMap,
  LivePlayer,
  Markers,
  PrivateDrawing,
  PrivateNode,
  Regions,
  TraceLine,
} from "../(interactive-map)";
import { Actions, MarkersSearch, Toaster, Whiteboard } from "../(controls)";
import { StreamingSender } from "./streaming-sender";
import { MapHotkeys } from "./map-hotkeys";
import { ResizeBorders } from "./resize-borders";
import { AdsScript } from "./ads-script";
import { AdsFallback } from "./ads-fallback";
import { Ads160x600Desktop } from "./ads-160-600-desktop";
import { Ads728x90Desktop } from "./ads-728-90-desktop";
import { Ads300x250Overlay } from "./ads-300-250-overlay";
import { Ads400x300Overlay } from "./ads-400-300-overlay";
import { Ads400x900Desktop } from "./ads-400-900-desktop";
import { Ads400x600Desktop } from "./ads-400-600-desktop";

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
  moreSettings,
  version,
  hideAds = false,
  drawings,
}: {
  appConfig: OverwolfAppConfig;
  dict: Dict;
  tiles: TilesConfig;
  regions: RegionsConfig;
  typesIdMap?: Record<string, string>;
  filters: FiltersConfig;
  lockedWindowComponents?: React.ReactNode;
  additionalComponents?: React.ReactNode;
  globalFilters?: GlobalFiltersConfig;
  additionalFilters?: React.ReactNode;
  moreSettings?: React.ReactNode;
  version?: Version;
  hideAds?: boolean;
  drawings?: DrawingsConfig;
}): JSX.Element {
  const isOverlay = useOverwolfState((state) => state.isOverlay);
  const overlayMode = useSettingsStore((state) => state.overlayMode);
  const lockedWindow = useSettingsStore((state) => state.lockedWindow);

  return (
    <div
      className={cn(
        "font-sans min-h-dscreen text-white antialiased select-none overflow-hidden",
        !isOverlay || !overlayMode ? "bg-black" : "bg-transparent",
        {
          locked: isOverlay && lockedWindow,
        },
      )}
    >
      <I18NProvider dict={dict}>
        <TooltipProvider>
          <CoordinatesProvider
            appName={appConfig.name}
            filters={filters}
            staticDrawings={drawings}
            mapNames={Object.keys(tiles)}
            regions={regions}
            typesIdMap={typesIdMap}
            globalFilters={globalFilters}
            useCbor
            nodesPaths={version?.more.nodes}
          >
            <AppHeader
              title={appConfig.title}
              app={appConfig.title}
              gameClassId={appConfig.gameClassId}
              moreSettings={moreSettings}
            />
            <HeaderOffset bypass={Boolean(isOverlay) || lockedWindow} full>
              <MapContainer isOverlay={Boolean(isOverlay)}>
                <InteractiveMap
                  domain={appConfig.domain}
                  isOverlay={Boolean(isOverlay)}
                  tileOptions={tiles}
                  appName={appConfig.name}
                />
              </MapContainer>
              <Regions />
              <Markers
                markerOptions={appConfig.markerOptions}
                appName={appConfig.name}
                iconsPath={version?.more.icons}
              />
              {!lockedWindow && (
                <MarkersSearch
                  lastMapUpdate={version?.createdAt}
                  tileOptions={tiles}
                  appName={appConfig.name}
                  additionalFilters={additionalFilters}
                  iconsPath={version?.more.icons}
                />
              )}
              {lockedWindow ? lockedWindowComponents : null}
              {additionalComponents}
              <Actions>
                <Whiteboard domain={appConfig.domain} hidden={lockedWindow} />
                <StreamingSender
                  domain={appConfig.domain}
                  hidden={lockedWindow}
                  withoutLiveMode={appConfig.withoutLiveMode}
                />
                <PrivateNode
                  appName={appConfig.name}
                  hidden={lockedWindow}
                  iconsPath={version?.more.icons}
                />
                <PrivateDrawing hidden={lockedWindow} />
              </Actions>
              <LivePlayer
                markerOptions={appConfig.markerOptions}
                appName={appConfig.name}
                iconsPath={version?.more.icons}
                tilesConfig={tiles}
              />
              <TraceLine />
            </HeaderOffset>
            <MapHotkeys />
          </CoordinatesProvider>
        </TooltipProvider>
      </I18NProvider>
      <ResizeBorders />
      {!hideAds && (
        <AdsScript fallback={<AdsFallback title={appConfig.title} />}>
          <Ads160x600Desktop title={appConfig.title} />
          <Ads728x90Desktop title={appConfig.title} />
          <Ads300x250Overlay title={appConfig.title} />
          <Ads400x300Overlay title={appConfig.title} />
          <Ads400x600Desktop title={appConfig.title} />
          <Ads400x900Desktop title={appConfig.title} />
        </AdsScript>
      )}
      <Toaster />
      <PlausibleTracker
        apiHost="https://metrics.th.gl"
        domain={`${appConfig.domain}.th.gl-app`}
      />
    </div>
  );
}
