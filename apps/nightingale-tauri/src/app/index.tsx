import { cn, NIGHTINGALE, useSettingsStore } from "@repo/lib";
import { HeaderOffset, PlausibleTracker } from "@repo/ui/header";
import {
  InteractiveMap,
  Markers,
  Regions,
  LivePlayer,
  TraceLine,
} from "@repo/ui/interactive-map";
import type {
  Dict,
  FiltersCoordinates,
  NodesCoordinates,
  RegionsCoordinates,
} from "@repo/ui/providers";
import {
  CoordinatesProvider,
  TooltipProvider,
  I18NProvider,
} from "@repo/ui/providers";
import { MarkersSearch, Toaster } from "@repo/ui/controls";
import enDict from "../dicts/en.json" assert { type: "json" };
import _nodes from "../coordinates/nodes.json" assert { type: "json" };
import regions from "../coordinates/regions.json" assert { type: "json" };
import filters from "../coordinates/filters.json" assert { type: "json" };
import _typesIdMap from "../coordinates/types_id_map.json" assert { type: "json" };

const nodes = _nodes as NodesCoordinates;
const typesIdMap = _typesIdMap as Record<string, string>;

const APP = "Nightingale";
const TITLE = "Nightingale Map";
function App(): JSX.Element {
  const isOverlay = false;
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
      {/* <AppHeader app={APP} gameClassId={24020} /> */}
      <I18NProvider dict={enDict as unknown as Dict}>
        <TooltipProvider>
          <CoordinatesProvider
            filters={filters as FiltersCoordinates}
            mapNames={Object.keys(NIGHTINGALE.tileOptions)}
            regions={regions as RegionsCoordinates}
            staticNodes={nodes}
            typesIdMap={typesIdMap}
            view={{}}
          >
            <HeaderOffset bypass={Boolean(isOverlay)} full>
              {/* <MapContainer> */}
              <InteractiveMap
                domain="nightingale"
                isOverlay={Boolean(isOverlay)}
                tileOptions={NIGHTINGALE.tileOptions}
              />
              {/* </MapContainer> */}
              <Regions />
              <Markers markerOptions={NIGHTINGALE.markerOptions} />
              {(!lockedWindow || !isOverlay) && (
                <MarkersSearch tileOptions={NIGHTINGALE.tileOptions} />
              )}
              {/* <StreamingSender
                domain="nightingale"
                hidden={Boolean(lockedWindow && isOverlay)}
              /> */}
              <LivePlayer markerOptions={NIGHTINGALE.markerOptions} />
              <TraceLine />
            </HeaderOffset>
          </CoordinatesProvider>
        </TooltipProvider>
      </I18NProvider>
      {/* <ResizeBorders />
      <AdsScript fallback={<AdsFallback title={TITLE} />}>
        <Ads160x600Desktop title={TITLE} />
        <Ads728x90Desktop title={TITLE} />
        <Ads300x250Overlay title={TITLE} />
        <Ads400x300Overlay title={TITLE} />
        <Ads400x600Desktop title={TITLE} />
        <Ads400x900Desktop title={TITLE} />
      </AdsScript>
      <MapHotkeys /> */}
      <Toaster />
      {/* <Status /> */}
      <PlausibleTracker
        apiHost="https://metrics.th.gl"
        domain="nightingale.th.gl-app"
      />
    </div>
  );
}

export default App;
