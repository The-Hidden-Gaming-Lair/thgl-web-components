import {
  type MarkerOptions,
  type TileOptions,
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
import type {
  Dict,
  FiltersCoordinates,
  GlobalFiltersCoordinates,
  NodesCoordinates,
  RegionsCoordinates,
} from "@repo/ui/providers";
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
import enDictGlobal from "../global_dicts/en.json" assert { type: "json" };
import enDict from "../dicts/en.json" assert { type: "json" };
import _nodes from "../coordinates/nodes.json" assert { type: "json" };
import regions from "../coordinates/regions.json" assert { type: "json" };
import filters from "../coordinates/filters.json" assert { type: "json" };
import _typesIdMap from "../coordinates/types_id_map.json" assert { type: "json" };
import tiles from "../coordinates/tiles.json" assert { type: "json" };
import globalFilters from "../coordinates/global-filters.json" assert { type: "json" };

const enDictMerged = { ...enDictGlobal, ...enDict } as unknown as Dict;
const nodes = _nodes as NodesCoordinates;
const typesIdMap = _typesIdMap as Record<string, string>;

const APP = "Wuthering Waves";
const TITLE = "Wuthering Waves Map";
const MARKER_OPTIONS: MarkerOptions = {
  radius: 6,
  playerIcon: "player.webp",
  zPos: {
    xyMaxDistance: 15000,
    zDistance: 400,
  },
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
            mapNames={Object.keys(tiles)}
            regions={regions as unknown as RegionsCoordinates}
            staticNodes={nodes}
            typesIdMap={typesIdMap}
            globalFilters={globalFilters as GlobalFiltersCoordinates}
            view={{}}
          >
            <AppHeader title="Wuthering" app={APP} gameClassId={24300} />
            <HeaderOffset bypass={Boolean(isOverlay)} full>
              <MapContainer>
                <InteractiveMap
                  domain="wuthering"
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
                <Whiteboard domain="wuthering" hidden={hidden} />
                <StreamingSender domain="wuthering" hidden={hidden} />
                <PrivateNode hidden={hidden} />
                <PrivateDrawing hidden={hidden} />
              </Actions>
              <LivePlayer markerOptions={MARKER_OPTIONS} />
              <TraceLine />
            </HeaderOffset>
            <MapHotkeys />
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
      <Toaster />
      <PlausibleTracker
        apiHost="https://metrics.th.gl"
        domain="wuthering.th.gl-app"
      />
    </div>
  );
}

export default App;
