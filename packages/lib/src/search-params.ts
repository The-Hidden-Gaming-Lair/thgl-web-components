export type View = {
  center?: [number, number];
  zoom?: number;
  map?: string;
  filters?: string[];
  globalFilters?: string[];
};
export function searchParamsToView(
  searchParams: Record<string, string | string[] | undefined>,
  possibleFilters: string[],
  possibleGlobalFilters: string[],
): View {
  const view: View = {};
  try {
    const { center, zoom, map, filters } = searchParams;
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
    if (typeof filters === "string") {
      try {
        const { f, g } = JSON.parse(filters);
        if (f) {
          view.filters = unmapArrayValues(possibleFilters, f);
        }
        if (g) {
          view.globalFilters = unmapArrayValues(possibleGlobalFilters, g);
        }
      } catch (e) {
        console.error(e);
      }
    }
  } catch (e) {}
  return view;
}

export function mapArrayValues(possibleValues: string[], values: string[]) {
  const sorted = possibleValues.sort();
  return values
    .map((f) => sorted.indexOf(f))
    .filter((i) => i !== -1)
    .sort((a, b) => a - b)
    .join(",");
}

export function unmapArrayValues(possibleValues: string[], values: string) {
  const sorted = possibleValues.sort();
  return values.split(",").map((v) => sorted[parseInt(v)]);
}
