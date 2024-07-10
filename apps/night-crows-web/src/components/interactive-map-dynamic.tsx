import {
  InteractiveMap,
  Markers,
  Regions,
  LivePlayer,
  TraceLine,
  PrivateNode,
  PrivateDrawing,
} from "@repo/ui/interactive-map";
import { Actions, LiveShare } from "@repo/ui/controls";
import type { TileOptions } from "@repo/lib";
import tiles from "../coordinates/tiles.json" assert { type: "json" };

const MARKER_OPTIONS = {
  radius: 6,
  playerZoom: 4,
};
export default function InteractiveMapDynamic(): JSX.Element {
  return (
    <>
      <InteractiveMap
        domain="nightcrows"
        tileOptions={tiles as unknown as TileOptions}
      />
      <Regions />
      <Markers markerOptions={MARKER_OPTIONS} />
      <LivePlayer markerOptions={MARKER_OPTIONS} />
      <TraceLine />
      <Actions>
        <LiveShare domain="nightcrows" />
        <PrivateNode />
        <PrivateDrawing />
      </Actions>
    </>
  );
}
