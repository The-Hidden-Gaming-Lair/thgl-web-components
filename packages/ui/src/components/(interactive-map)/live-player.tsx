import { MarkerOptions, TilesConfig, useGameState } from "@repo/lib";
import { Player } from "./player";

export function LivePlayer({
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
  const player = useGameState((state) => state.player);

  if (!player) {
    return <></>;
  }
  return (
    <Player
      appName={appName}
      player={player}
      markerOptions={markerOptions}
      iconsPath={iconsPath}
      tilesConfig={tilesConfig}
    />
  );
}
