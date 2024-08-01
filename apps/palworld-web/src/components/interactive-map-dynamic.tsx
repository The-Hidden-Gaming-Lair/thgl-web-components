import {
  InteractiveMap,
  Markers,
  Regions,
  LivePlayer,
  TraceLine,
  PrivateNode,
  PrivateDrawing,
} from "@repo/ui/interactive-map";
import { type TileOptions } from "@repo/lib";
import { Actions, StreamingReceiver, Whiteboard } from "@repo/ui/controls";
import tiles from "../coordinates/tiles.json" assert { type: "json" };

const MARKER_OPTIONS = {
  radius: 6,
};
export default function InteractiveMapDynamic(): JSX.Element {
  return (
    <>
      <InteractiveMap
        domain="palworld"
        tileOptions={tiles as unknown as TileOptions}
      />
      <Regions />
      <Markers markerOptions={MARKER_OPTIONS} />
      <LivePlayer markerOptions={MARKER_OPTIONS} />
      <TraceLine />
      <Actions>
        <Whiteboard domain="palworld" />
        <StreamingReceiver
          domain="palworld"
          href="https://www.overwolf.com/oneapp/Leon_Machens-Palworld-Interactive-map"
        />
        <PrivateNode />
        <PrivateDrawing />
      </Actions>
    </>
  );
}
