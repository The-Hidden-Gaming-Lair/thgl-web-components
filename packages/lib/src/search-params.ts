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
  possibleGlobalFilters?: string[],
): View {
  const view: View = {};
  try {
    const { center, zoom, map, filters, types, hide } = searchParams;
    if (typeof map === "string") {
      view.map = map;
    }
    if (typeof center === "string") {
      const [lat, lng] = center.split(",").map((v) => parseFloat(v));
      // Number.isFinite (not !isNaN): "1e999" parses to Infinity, which passes
      // isNaN, poisons the persisted per-map view, and blacks out the map.
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        view.center = [lat, lng];
      }
    }
    if (typeof zoom === "string") {
      const z = parseFloat(zoom);
      if (Number.isFinite(z)) {
        view.zoom = z;
      }
    }
    if (typeof filters === "string") {
      try {
        const { f, g } = JSON.parse(filters);
        if (f) {
          view.filters = unmapArrayValues(possibleFilters, f);
        }
        if (g && possibleGlobalFilters) {
          view.globalFilters = unmapArrayValues(possibleGlobalFilters, g);
        }
      } catch (e) {
        console.error(e);
      }
    }
    // Stable alternative to the index-encoded `filters` (embeds): plain filter
    // value ids, comma-separated. Unknown ids are dropped.
    if (typeof types === "string" && types) {
      view.filters = types
        .split(",")
        .filter((id) => possibleFilters.includes(id));
    } else if (typeof hide === "string" && hide) {
      // The inverse (shorter when most types are shown): all except these.
      const hidden = new Set(hide.split(","));
      view.filters = possibleFilters.filter((id) => !hidden.has(id));
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
