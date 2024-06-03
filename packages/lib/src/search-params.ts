export function searchParamsToView(
  searchParams: Record<string, string | string[] | undefined>
): { center?: [number, number]; zoom?: number; map?: string } {
  const view: { center?: [number, number]; zoom?: number; map?: string } = {};
  try {
    const { center, zoom, map } = searchParams;
    if (typeof map === "string") {
      view.map = map;
    }
    if (typeof center === "string") {
      const [lat, lng] = center.split(",").map((v) => parseFloat(v));
      if (!isNaN(lat) && !isNaN(lng)) {
        view.center = [lat, lng];
      }
    }
    if (typeof zoom === "string") {
      const z = parseFloat(zoom);
      if (!isNaN(z)) {
        view.zoom = z;
      }
    }
  } catch (e) {}
  return view;
}
