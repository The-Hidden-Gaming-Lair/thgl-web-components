import {
  InteractiveMap,
  Markers,
  PrivateDrawing,
  PrivateNode,
  Regions,
} from "@repo/ui/interactive-map";
import type { TileOptions } from "@repo/lib";
import { Actions, Whiteboard } from "@repo/ui/controls";
import tiles from "../coordinates/tiles.json" assert { type: "json" };

const markerOptions = {
  radius: 10,
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
      <Actions>
        <Whiteboard domain="oncehuman" />
        <PrivateNode />
        <PrivateDrawing />
      </Actions>
    </>
  );
}
