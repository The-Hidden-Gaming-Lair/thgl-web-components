import {
  InteractiveMap,
  LivePlayer,
  Markers,
  PrivateDrawing,
  PrivateNode,
  Regions,
  TraceLine,
} from "@repo/ui/interactive-map";
import type { TileOptions } from "@repo/lib";
import { Actions, StreamingReceiver, Whiteboard } from "@repo/ui/controls";
import tiles from "../coordinates/tiles.json" assert { type: "json" };

const markerOptions = {
  radius: 10,
  playerIcon: "player.webp",
};
export default function InteractiveMapDynamic(): JSX.Element {
  return (
    <>
      <InteractiveMap
        domain="oncehuman"
        tileOptions={tiles as unknown as TileOptions}
      />
      <Regions />
      <Markers markerOptions={markerOptions} />
      <LivePlayer markerOptions={markerOptions} />
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
