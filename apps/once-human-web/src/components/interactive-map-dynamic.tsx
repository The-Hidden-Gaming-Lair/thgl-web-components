import {
  InteractiveMap,
  LivePlayer,
  Markers,
  PrivateDrawing,
  PrivateNode,
  Regions,
  TraceLine,
} from "@repo/ui/interactive-map";
import type { MarkerOptions, TileOptions } from "@repo/lib";
import { Actions, StreamingReceiver, Whiteboard } from "@repo/ui/controls";
import tiles from "../coordinates/tiles.json" assert { type: "json" };

const MARKER_OPTIONS: MarkerOptions = {
  radius: 6,
  playerIcon: "player.webp",
  zPos: {
    xyMaxDistance: 200,
    zDistance: 3,
  },
};
export default function InteractiveMapDynamic(): JSX.Element {
  return (
    <>
      <InteractiveMap
        domain="oncehuman"
        tileOptions={tiles as unknown as TileOptions}
      />
      <Regions />
      <Markers markerOptions={MARKER_OPTIONS} />
      <LivePlayer markerOptions={MARKER_OPTIONS} />
      <TraceLine />
      <Actions>
        <Whiteboard domain="oncehuman" />
        <StreamingReceiver
          domain="oncehuman"
          href="https://www.overwolf.com/app/Leon_Machens-Once_Human_Map"
        />
        <PrivateNode />
        <PrivateDrawing />
      </Actions>
    </>
  );
}
