import {
  InteractiveMap,
  Markers,
  Regions,
  LivePlayer,
  TraceLine,
  PrivateNode,
  PrivateDrawing,
} from "@repo/ui/interactive-map";
import { NIGHTINGALE } from "@repo/lib";
import { Actions, StreamingReceiver } from "@repo/ui/controls";

export default function InteractiveMapDynamic(): JSX.Element {
  return (
    <>
      <InteractiveMap
        domain="nightingale"
        tileOptions={NIGHTINGALE.tileOptions}
      />
      <Regions />
      <Markers markerOptions={NIGHTINGALE.markerOptions} />
      <LivePlayer markerOptions={NIGHTINGALE.markerOptions} />
      <TraceLine />
      <Actions>
        <StreamingReceiver
          domain="nightingale"
          href="https://www.overwolf.com/app/Leon_Machens-Nightingale_Map"
        />
        <PrivateNode />
        <PrivateDrawing />
      </Actions>
    </>
  );
}
