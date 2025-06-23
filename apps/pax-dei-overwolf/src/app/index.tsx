import {
  DrawingsConfig,
  FiltersConfig,
  MarkerOptions,
  RegionsConfig,
  TilesConfig,
  cn,
  useSettingsStore,
} from "@repo/lib";
import { HeaderOffset, PlausibleTracker } from "@repo/ui/header";
import {
  InteractiveMap,
  Markers,
  Regions,
  LivePlayer,
  TraceLine,
  PrivateNode,
  PrivateDrawing,
} from "@repo/ui/interactive-map";
import {
  CoordinatesProvider,
  TooltipProvider,
  I18NProvider,
} from "@repo/ui/providers";
import { Actions, MarkersSearch, Toaster, Whiteboard } from "@repo/ui/controls";
import { useOverwolfState } from "@repo/lib/overwolf";
import {
  Ads160x600Desktop,
  Ads300x250Overlay,
  Ads400x300Overlay,
  Ads400x600Desktop,
  Ads400x900Desktop,
  Ads728x90Desktop,
  AppHeader,
  MapHotkeys,
  MapContainer,
  ResizeBorders,
  StreamingSender,
  AdsScript,
  AdsFallback,
} from "@repo/ui/overwolf";
import { Dict } from "@repo/ui/providers";
import { APP_CONFIG } from "@/config";

const MARKER_OPTIONS: MarkerOptions = {
  imageSprite: true,
  radius: 6,
  playerIcon: "player.webp",
};
function App({
  dict,
  drawings,
  filters,
  tiles,
  typesIdMap,
  regions,
}: {
  dict: Dict;
  drawings: DrawingsConfig;
  tiles: TilesConfig;
  regions: RegionsConfig;
  typesIdMap?: Record<string, string>;
  filters: FiltersConfig;
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
            appName={APP_CONFIG.name}
            filters={filters}
            staticDrawings={drawings}
            mapNames={Object.keys(tiles)}
            useCbor
            regions={regions}
            typesIdMap={typesIdMap}
          >
            <AppHeader
              title={APP_CONFIG.title}
              app={APP_CONFIG.title}
              gameClassId={APP_CONFIG.gameClassId}
            />
            <HeaderOffset bypass={Boolean(isOverlay) || lockedWindow} full>
              <MapContainer isOverlay={Boolean(isOverlay)}>
                <InteractiveMap
                  domain={APP_CONFIG.domain}
                  isOverlay={Boolean(isOverlay)}
                  tileOptions={tiles}
                  appName={APP_CONFIG.name}
                />
              </MapContainer>
              <Regions />
              <Markers
                markerOptions={MARKER_OPTIONS}
                appName={APP_CONFIG.name}
              />
              {!lockedWindow && (
                <MarkersSearch tileOptions={tiles} appName={APP_CONFIG.name} />
              )}
              <Actions>
                <Whiteboard domain={APP_CONFIG.domain} hidden={lockedWindow} />
                {/* <StreamingSender domain={APP_CONFIG.domain} hidden={lockedWindow} /> */}
                <PrivateNode hidden={lockedWindow} />
                <PrivateDrawing hidden={lockedWindow} />
              </Actions>
              <LivePlayer
                markerOptions={MARKER_OPTIONS}
                appName={APP_CONFIG.name}
                tilesConfig={tiles}
              />
              <TraceLine />
            </HeaderOffset>
            <MapHotkeys />
          </CoordinatesProvider>
        </TooltipProvider>
      </I18NProvider>
      <ResizeBorders />
      {!typesIdMap && (
        <AdsScript fallback={<AdsFallback title={APP_CONFIG.title} />}>
          <Ads160x600Desktop title={APP_CONFIG.title} />
          <Ads728x90Desktop title={APP_CONFIG.title} />
          <Ads300x250Overlay title={APP_CONFIG.title} />
          <Ads400x300Overlay title={APP_CONFIG.title} />
          <Ads400x600Desktop title={APP_CONFIG.title} />
          <Ads400x900Desktop title={APP_CONFIG.title} />
        </AdsScript>
      )}
      <Toaster />
      <PlausibleTracker
        apiHost="https://metrics.th.gl"
        domain={`${APP_CONFIG.domain}.th.gl-app`}
      />
    </div>
  );
}

export default App;
