"use client";

import { useMemo } from "react";
import type { MarkerOptions, TilesConfig } from "@repo/lib";
import { usePeersStore } from "../(providers)/peers-store";
import { Teammate } from "./teammate";

export function LiveTeammates({
  appName,
  markerOptions,
  iconsPath,
  tilesConfig,
}: {
  appName: string;
  markerOptions: MarkerOptions;
  iconsPath: string;
  tilesConfig: TilesConfig;
}) {
  const remotePlayers = usePeersStore((s) => s.remotePlayers);

  const players = useMemo(() => Object.values(remotePlayers), [remotePlayers]);
  if (!players.length) return <></>;

  return (
    <>
      {players.map((p) => (
        <Teammate
          key={p.id}
          appName={appName}
          player={p}
          markerOptions={markerOptions}
          iconsPath={iconsPath}
          tilesConfig={tilesConfig}
        />
      ))}
    </>
  );
}
