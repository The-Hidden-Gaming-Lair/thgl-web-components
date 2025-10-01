import type { AdditionalContent } from "@repo/lib";
import { PlayerDetails } from "./player-details";
import {
  DuneDeepDesertGrid,
  DuneHeatmaps,
  PaliaGrid,
  PaliaGridToggle,
  PaliaTime,
  PaliaWeeklyWants,
} from "../(data)";

const ADDITIONAL_CONTENT = {
  PlayerDetails: PlayerDetails,
  PaliaWeeklyWants: PaliaWeeklyWants,
  PaliaGrid: PaliaGrid,
  PaliaGridToggle: PaliaGridToggle,
  PaliaTime: PaliaTime,
  DuneDeepDesertGrid: DuneDeepDesertGrid,
  DuneHeatmaps: DuneHeatmaps,
} as const;

export type AdditionalContentType = ({
  latLng,
}: {
  latLng: [number, number] | [number, number, number];
}) => JSX.Element;

export function AdditionalContent({
  items,
}: {
  items: Array<AdditionalContent>;
}) {
  return (
    <>
      {items.map((item) => {
        const Filter = ADDITIONAL_CONTENT[item];
        return <Filter key={item} />;
      })}
    </>
  );
}
