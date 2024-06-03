import { MarkerOptions, useGameState } from "@repo/lib";
import { Player } from "./player";

export function LivePlayer({
  markerOptions,
}: {
  markerOptions: MarkerOptions;
}) {
  const player = useGameState((state) => state.player);

  if (!player) {
    return <></>;
  }
  return <Player player={player} markerOptions={markerOptions} />;
}
