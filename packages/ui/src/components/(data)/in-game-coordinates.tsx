import { toInGameCoords } from "@repo/lib";
import { useCoordinates } from "../(providers)";

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
  const { inGameCoordinates } = useCoordinates();
  if (!inGameCoordinates) return null;
  const { x, y } = toInGameCoords(latLng, inGameCoordinates);
  return (
    <p>
      <b>In-Game: </b>[{x}, {y}]
    </p>
  );
}
