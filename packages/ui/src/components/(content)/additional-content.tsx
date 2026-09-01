import type { AdditionalContent } from "@repo/lib";
import { PlayerDetails } from "./player-details";
import {
  CrimsonDesertZones,
  CrimsonDesertSaveImport,
  DragonSwordSaveImport,
  DuneDeepDesertGrid,
  DuneHeatmaps,
  PaliaActiveWorlds,
  PaliaGrid,
  PaliaGridToggle,
  PaliaTime,
  PaliaWeeklyWants,
  PaliaWorldCodeRequest,
  SatisfactorySeed,
} from "../(data)";

import type { JSX } from "react";

const ADDITIONAL_CONTENT = {
  PlayerDetails: PlayerDetails,
  PaliaActiveWorlds: PaliaActiveWorlds,
  PaliaWorldCodeRequest: PaliaWorldCodeRequest,
  PaliaWeeklyWants: PaliaWeeklyWants,
  PaliaGrid: PaliaGrid,
  PaliaGridToggle: PaliaGridToggle,
  PaliaTime: PaliaTime,
  DuneDeepDesertGrid: DuneDeepDesertGrid,
  DuneHeatmaps: DuneHeatmaps,
  CrimsonDesertZones: CrimsonDesertZones,
  CrimsonDesertSaveImport: CrimsonDesertSaveImport,
  DragonSwordSaveImport: DragonSwordSaveImport,
  SatisfactorySeed: SatisfactorySeed,
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
