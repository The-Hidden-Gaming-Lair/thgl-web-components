import { type TileOptions, cn, useSettingsStore } from "@repo/lib";
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
import type {
  NodesCoordinates,
  RegionsCoordinates,
  Dict,
  FiltersCoordinates,
} from "@repo/ui/providers";
import {
  CoordinatesProvider,
  TooltipProvider,
  I18NProvider,
} from "@repo/ui/providers";
import { Actions, MarkersSearch, Toaster } from "@repo/ui/controls";
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
  Status,
  StreamingSender,
  AdsScript,
  AdsFallback,
} from "@repo/ui/overwolf";
import enDictGlobal from "../global_dicts/en.json" assert { type: "json" };
import enDict from "../dicts/en.json" assert { type: "json" };
import _nodes from "../coordinates/nodes.json" assert { type: "json" };
import regions from "../coordinates/regions.json" assert { type: "json" };
import filters from "../coordinates/filters.json" assert { type: "json" };
import _typesIdMap from "../coordinates/types_id_map.json" assert { type: "json" };
import tiles from "../coordinates/tiles.json" assert { type: "json" };

const enDictMerged = { ...enDictGlobal, ...enDict } as unknown as Dict;

const nodes = _nodes as NodesCoordinates;
const typesIdMap = _typesIdMap as Record<string, string>;

const APP = "Palworld";
const TITLE = "Palworld Map";
const MARKER_OPTIONS = {
  radius: 6,
  playerZoom: 4,
};
function App(): JSX.Element {
  const isOverlay = useOverwolfState((state) => state.isOverlay);
  const overlayMode = useSettingsStore((state) => state.overlayMode);
  const lockedWindow = useSettingsStore((state) => state.lockedWindow);
  const hidden = Boolean(lockedWindow && isOverlay);

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
      <I18NProvider dict={enDictMerged}>
        <TooltipProvider>
          <CoordinatesProvider
            filters={filters as FiltersCoordinates}
            regions={regions as RegionsCoordinates}
            mapNames={Object.keys(tiles)}
            staticNodes={nodes}
            typesIdMap={typesIdMap}
            view={{}}
          >
            <AppHeader app={APP} gameClassId={23944} />
            <HeaderOffset bypass={Boolean(isOverlay)} full>
              <MapContainer>
                <InteractiveMap
                  domain="palworld"
                  isOverlay={Boolean(isOverlay)}
                  tileOptions={tiles as unknown as TileOptions}
                />
              </MapContainer>
              <Regions />
              <Markers markerOptions={MARKER_OPTIONS} />
              {!hidden && (
                <MarkersSearch tileOptions={tiles as unknown as TileOptions} />
              )}
              <Actions>
                <StreamingSender domain="palworld" hidden={hidden} />
                <PrivateNode hidden={hidden} />
                <PrivateDrawing hidden={hidden} />
              </Actions>
              <LivePlayer markerOptions={MARKER_OPTIONS} />
              <TraceLine />
            </HeaderOffset>
          </CoordinatesProvider>
        </TooltipProvider>
      </I18NProvider>
      <ResizeBorders />
      <AdsScript fallback={<AdsFallback title={TITLE} />}>
        <Ads160x600Desktop title={TITLE} />
        <Ads728x90Desktop title={TITLE} />
        <Ads300x250Overlay title={TITLE} />
        <Ads400x300Overlay title={TITLE} />
        <Ads400x600Desktop title={TITLE} />
        <Ads400x900Desktop title={TITLE} />
      </AdsScript>
      <MapHotkeys />
      <Toaster />
      <Status />
      <PlausibleTracker
        apiHost="https://metrics.th.gl"
        domain="palworld.th.gl-app"
      />
    </div>
  );
}

export default App;
