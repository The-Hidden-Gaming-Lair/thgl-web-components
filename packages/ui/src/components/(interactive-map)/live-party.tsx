"use client";

import { useMemo } from "react";
import { useGameState, type MarkerOptions, type TilesConfig } from "@repo/lib";
import type { RemotePlayer } from "../(providers)/peers-store";
import { Teammate } from "./teammate";

/** One ring colour per party slot (portrait order); the leader keeps gold. */
const PARTY_COLORS = [
  "#f2c14e",
  "#4ea8de",
  "#80d26a",
  "#e06c75",
  "#c792ea",
  "#4ecdc4",
];

/**
 * Party games (Baldur's Gate EE): the app reports the camera as the player and every party
 * member in `player.party`. Each member gets its own marker - the game portrait
 * (icons/portraits/<id>.webp) on a coloured ring, or just the coloured circle when the
 * portrait is a custom one the game data does not have - with a "name hp/max" label. Members
 * never rotate (the game camera never does).
 */
export function LiveParty({
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
  const party = useGameState((s) => s.player?.party);
  const mapName = useGameState((s) => s.player?.mapName);

  const members = useMemo(
    () =>
      (party ?? []).map((m, i) => ({
        icon: m.portrait ? `portraits/${m.portrait}.webp` : "",
        player: {
          id: `party-${i}`,
          name:
            m.maxHp && m.hp !== undefined
              ? `${m.name} ${m.hp}/${m.maxHp}`
              : m.name,
          color: PARTY_COLORS[i % PARTY_COLORS.length],
          address: 0,
          type: "party",
          mapName,
          x: m.x,
          y: m.y,
          z: 0,
          r: 0,
        } satisfies RemotePlayer,
      })),
    [party, mapName],
  );
  if (!members.length) return <></>;

  return (
    <>
      {members.map(({ player, icon }) => (
        <Teammate
          key={player.id}
          appName={appName}
          player={player}
          markerOptions={markerOptions}
          iconsPath={iconsPath}
          tilesConfig={tilesConfig}
          icon={icon}
        />
      ))}
    </>
  );
}
