/**
 * Shareable map sub-selection state as URL query params, kept alongside the map path
 * (`/maps/<Map>?stage=barren&layer=Underground`). Used by the terraform-stage selector
 * and the layered-interior (Wuthering Waves underground) selector so a link reproduces
 * the exact view. The map itself stays in the PATH; these are its sub-selections.
 *
 * Writes use replaceState (no history spam per toggle). Switching maps via MapSelect
 * pushes a fresh `/maps/<Map>` with no query, which naturally clears these.
 */
export function getMapParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

export function setMapParam(key: string, value: string | null): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (value == null || value === "") url.searchParams.delete(key);
  else url.searchParams.set(key, value);
  window.history.replaceState({}, "", url.toString());
}
