const TRANSL_X = 123888;
const TRANSL_Y = 158000;
const SCALE = 459;

function toInGameCoords(
  x: number,
  y: number,
): {
  x: number;
  y: number;
} {
  // Translate
  const newX = x + TRANSL_X;
  const newY = y - TRANSL_Y;

  // Coordinates are intentionally flipped
  return {
    x: Math.round(newY / SCALE),
    y: Math.round(newX / SCALE),
  };
}

export function PalworldCoordinates({
  latLng,
}: {
  latLng: [number, number] | [number, number, number];
}) {
  const inGameCoords = toInGameCoords(latLng[0], latLng[1]);
  return (
    <p>
      <b>In-Game: </b>[{inGameCoords.x}, {inGameCoords.y}]
    </p>
  );
}
