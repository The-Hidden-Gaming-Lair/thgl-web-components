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
import type { TileOptions } from "@repo/lib";
import tiles from "../coordinates/tiles.json" assert { type: "json" };

const MARKER_OPTIONS = {
  radius: 6,
  playerIcon: "player.webp",
};
export default function InteractiveMapDynamic(): JSX.Element {
  return (
    <>
      <InteractiveMap
        domain="hogwarts"
        tileOptions={tiles as unknown as TileOptions}
      />
      <Regions />
      <Markers markerOptions={MARKER_OPTIONS} />
      <LivePlayer markerOptions={MARKER_OPTIONS} />
      <TraceLine />
      <Actions>
        <Whiteboard domain="hogwarts" />
        <StreamingReceiver
          domain="hogwarts"
          href="https://www.overwolf.com/app/Leon_Machens-Hogwarts.gg"
        />
        <PrivateNode />
        <PrivateDrawing />
      </Actions>
    </>
  );
}
