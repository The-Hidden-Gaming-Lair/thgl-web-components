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
import type { MarkerOptions, TileOptions } from "@repo/lib";
import tiles from "../coordinates/tiles.json" assert { type: "json" };

const MARKER_OPTIONS: MarkerOptions = {
  imageSprite: true,
  radius: 6,
};
export default function InteractiveMapDynamic({
  embed,
}: {
  embed?: boolean;
}): JSX.Element {
  return (
    <>
      <InteractiveMap
        domain="paxdei"
        tileOptions={tiles as unknown as TileOptions}
      />
      <Regions />
      <Markers markerOptions={MARKER_OPTIONS} />
      {!embed && (
        <>
          <LivePlayer markerOptions={MARKER_OPTIONS} />
          <TraceLine />
          <Actions>
            <Whiteboard domain="paxdei" />
            <PrivateNode />
            <PrivateDrawing />
          </Actions>
        </>
      )}
    </>
  );
}
