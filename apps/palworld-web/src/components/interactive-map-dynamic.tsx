import {
  InteractiveMap,
  Markers,
  Regions,
  LivePlayer,
  TraceLine,
  PrivateNode,
  PrivateDrawing,
} from "@repo/ui/interactive-map";
import { PALWORLD } from "@repo/lib";
import { Actions, StreamingReceiver } from "@repo/ui/controls";

export default function InteractiveMapDynamic(): JSX.Element {
  return (
    <>
      <InteractiveMap domain="palworld" tileOptions={PALWORLD.tileOptions} />
      <Regions />
      <Markers markerOptions={PALWORLD.markerOptions} />
      <LivePlayer markerOptions={PALWORLD.markerOptions} />
      <TraceLine />
      <Actions>
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
