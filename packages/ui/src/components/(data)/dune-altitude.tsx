import { useT } from "../(providers)";

export function DuneAltitude({
  latLng,
}: {
  latLng: [number, number] | [number, number, number];
}) {
  const t = useT();

  if (!latLng[2]) {
    return null;
  }
  const altitude = (latLng[2] / 100 + 300).toFixed(2);
  return (
    <p>
      <b>{t("marker.altitude")}: </b>
      {altitude}M
    </p>
  );
}
