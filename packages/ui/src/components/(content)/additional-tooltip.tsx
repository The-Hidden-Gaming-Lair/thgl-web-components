import { type AdditionalTooltip } from "@repo/lib";
import { PalworldCoordinates, DuneAltitude } from "../(data)";

export const ADDITIONAL_TOOLTIP = {
  PalworldCoordinates: PalworldCoordinates,
  DuneAltitude: DuneAltitude,
} as const;

export type AdditionalTooltipType = Array<AdditionalTooltip>;
export function AdditionalTooltip({
  items,
  latLng,
}: {
  items: Array<AdditionalTooltip>;
  latLng: [number, number] | [number, number, number];
}) {
  return (
    <>
      {items.map((item) => {
        const Filter = ADDITIONAL_TOOLTIP[item];
        return <Filter key={item} latLng={latLng} />;
      })}
    </>
  );
}
