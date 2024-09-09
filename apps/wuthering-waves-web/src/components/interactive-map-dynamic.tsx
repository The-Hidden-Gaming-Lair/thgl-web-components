import {
  InteractiveMap,
  Markers,
  Regions,
  LivePlayer,
  TraceLine,
  PrivateNode,
  PrivateDrawing,
} from "@repo/ui/interactive-map";
import { Actions, StreamingReceiver, Whiteboard } from "@repo/ui/controls";
import type { MarkerOptions, TileOptions } from "@repo/lib";
import tiles from "../coordinates/tiles.json" assert { type: "json" };

const MARKER_OPTIONS: MarkerOptions = {
  radius: 6,
  playerIcon: "player.webp",
  zPos: {
    xyMaxDistance: 15000,
    zDistance: 400,
  },
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
        <Whiteboard domain="wuthering" />
        <StreamingReceiver
          domain="wuthering"
          href="https://www.overwolf.com/app/Leon_Machens-Wuthering_Waves_Map"
        />
        <PrivateNode />
        <PrivateDrawing />
      </Actions>
    </>
  );
}
