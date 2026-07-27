import { toInGameCoords } from "@repo/lib";
import { useCoordinatesOptional } from "../(providers)";

/**
 * Tooltip line showing the coordinates the game itself displays for a marker,
 * derived from the map position via the per-game `inGameCoordinates` transform.
 * Renders nothing when the current game has no transform configured.
 */
export function InGameCoordinates({
  latLng,
}: {
  latLng: [number, number] | [number, number, number];
}) {
  // Optional: this tooltip line also renders on the guide-page mini-map, which
  // has no CoordinatesProvider. Without one, we simply omit the in-game line.
  const inGameCoordinates = useCoordinatesOptional()?.inGameCoordinates;
  if (!inGameCoordinates) return null;
  const { x, y } = toInGameCoords(latLng, inGameCoordinates);
  return (
    <p>
      <b>In-Game: </b>[{x}, {y}]
    </p>
  );
}
