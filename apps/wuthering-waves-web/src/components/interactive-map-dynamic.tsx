import {
  InteractiveMap,
  Markers,
  Regions,
  LivePlayer,
  TraceLine,
  PrivateNode,
  PrivateDrawing,
} from "@repo/ui/interactive-map";
import { Actions } from "@repo/ui/controls";
import type { TileOptions } from "@repo/lib";
import tiles from "../coordinates/tiles.json" assert { type: "json" };

const MARKER_OPTIONS = {
  radius: 6,
  playerZoom: 4,
  playerIcon: "player.webp",
};
export default function InteractiveMapDynamic(): JSX.Element {
  return (
    <>
      <InteractiveMap
        domain="wuthering"
        tileOptions={tiles as unknown as TileOptions}
      />
      <Regions />
      <Markers markerOptions={MARKER_OPTIONS} />
      <LivePlayer markerOptions={MARKER_OPTIONS} />
      <TraceLine />
      <Actions>
        {/* <StreamingReceiver
          domain="wuthering"
          href="https://www.overwolf.com/app/Leon_Machens-Wuthering_Waves_Map"
        /> */}
        <PrivateNode />
        <PrivateDrawing />
      </Actions>
    </>
  );
}
