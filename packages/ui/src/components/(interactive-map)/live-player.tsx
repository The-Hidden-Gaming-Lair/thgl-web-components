import { MarkerOptions, TilesConfig, useGameState } from "@repo/lib";
import { Player } from "./player";

export function LivePlayer({
  appName,
  markerOptions,
  iconsPath,
  tilesConfig,
  isOverlay,
}: {
  appName: string;
  markerOptions: MarkerOptions;
  iconsPath: string;
  tilesConfig: TilesConfig;
  /** In-game overlay window (reads the overlay's own rotate setting). */
  isOverlay?: boolean;
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
      isOverlay={isOverlay}
    />
  );
}
