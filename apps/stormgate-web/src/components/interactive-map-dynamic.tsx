import {
  InteractiveMap,
  Markers,
  Regions,
  LivePlayer,
  TraceLine,
  PrivateNode,
  PrivateDrawing,
} from "@repo/ui/interactive-map";
import { Actions, Whiteboard } from "@repo/ui/controls";
import type { TilesConfig } from "@repo/lib";
import _tiles from "../coordinates/tiles.json" assert { type: "json" };

const tiles = _tiles as unknown as TilesConfig;

const MARKER_OPTIONS = {
  radius: 6,
  playerIcon: "player.webp",
};
export default function InteractiveMapDynamic(): JSX.Element {
  return (
    <>
      <InteractiveMap domain="stormgate" tileOptions={tiles} />
      <Regions />
      <Markers markerOptions={MARKER_OPTIONS} />
      <LivePlayer markerOptions={MARKER_OPTIONS} tilesConfig={tiles} />
      <TraceLine />
      <Actions>
        <Whiteboard domain="stormgate" />
        <PrivateNode />
        <PrivateDrawing />
      </Actions>
    </>
  );
}
