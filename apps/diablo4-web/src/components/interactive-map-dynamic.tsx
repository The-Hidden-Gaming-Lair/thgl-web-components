import {
  InteractiveMap,
  Markers,
  Regions,
  LivePlayer,
  TraceLine,
  PrivateNode,
  PrivateDrawing,
} from "@repo/ui/interactive-map";
import { Actions, StreamingReceiver } from "@repo/ui/controls";
import type { TileOptions } from "@repo/lib";
import tiles from "../coordinates/tiles.json" assert { type: "json" };

const MARKER_OPTIONS = {
  radius: 6,
  playerIcon: "player.webp",
};
export default function InteractiveMapDynamic({
  mobalytics,
}: {
  mobalytics?: boolean;
}): JSX.Element {
  return (
    <>
      <InteractiveMap
        domain="diablo4"
        tileOptions={tiles as unknown as TileOptions}
      />
      <Regions />
      <Markers markerOptions={MARKER_OPTIONS} />
      {!mobalytics && (
        <>
          <LivePlayer markerOptions={MARKER_OPTIONS} />
          <TraceLine />
          <Actions>
            <StreamingReceiver
              domain="diablo4"
              href="https://www.overwolf.com/app/Leon_Machens-Diablo_4_Map"
            />
            <PrivateNode />
            <PrivateDrawing />
          </Actions>
        </>
      )}
    </>
  );
}
