/**
 * Resolve a dict value, following pointer references (values starting with @)
 */
export function resolveDict(dict: Record<string, string>, key: string): string {
  const value = dict[key];
  if (!value) return key;
  if (value[0] === "@") {
    return dict[value] ?? value;
  }
  return value;
}

/**
 * Resolve a dict value with a fallback — tries multiple keys, then capitalizes raw key
 */
export function resolveDictWithFallback(
  dict: Record<string, string>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = dict[key];
    if (value) {
      return value[0] === "@" ? (dict[value] ?? value) : value;
    }
  }
  // Capitalize the last key as fallback
  const lastKey = keys[keys.length - 1] ?? "";
  return lastKey
    .replace(/^faction_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Per-locale text props. `props` text is written once, in English; data-forge
 * stores a game's own translation of `props[prop]` of entry `id` in the locale's
 * dict as `<id>.<prop>` (`dbPropKey`). Returns the props with every translated
 * text prop swapped in — the same object when the dict has none (e.g. en).
 * The structured props in JSON_PROPS (`upgradeTable`, `_sections`, `areas`) are
 * translated whole: their key holds the localized prop as JSON.
 */
export function localizeProps<T extends Record<string, unknown> | undefined>(
  props: T,
  id: string,
  dict: Record<string, string> | undefined,
): T {
  if (!props || !dict) return props;
  let out: Record<string, unknown> | undefined;
  for (const [key, value] of Object.entries(props)) {
    const json = JSON_PROPS[key];
    if (typeof value !== "string" && !json) continue;
    const dictKey = `${id}.${key}`;
    if (!dict[dictKey]) continue;
    const text = resolveDict(dict, dictKey);
    const localized =
      typeof value === "string" ? text : parseLocalizedJson(text, json!);
    if (localized === undefined) continue;
    out ??= { ...props };
    out[key] = localized;
  }
  return (out ?? props) as T;
}

/** Structured props a locale's dict can replace whole (JSON) → shape check. */
type JsonShape = {
  columns?: unknown;
  rows?: unknown;
  label?: unknown;
  items?: unknown;
};
const JSON_PROPS: Record<string, (v: JsonShape | null) => boolean> = {
  upgradeTable: (t) => Array.isArray(t?.columns) && Array.isArray(t?.rows),
  _sections: (s) => Array.isArray(s),
  areas: (a) => typeof a?.label === "string" && Array.isArray(a?.items),
};

/** A per-locale JSON prop dict value, or undefined when it isn't a valid one. */
function parseLocalizedJson(
  text: string | undefined,
  valid: (v: JsonShape | null) => boolean,
): unknown {
  if (!text || (text[0] !== "{" && text[0] !== "[")) return undefined;
  try {
    const v = JSON.parse(text);
    return valid(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Data-forge bakes each DB location row's `label` from the ENGLISH dict (the
 * spawn id, then the type). Re-resolve those keys in the page's dict so marker
 * tooltips and the fallback list follow the locale (node id = `<spawn id or
 * type>@y:x`); a row whose keys the dict lacks keeps its baked label.
 * `typeLabel` is the type's display name for the tooltip's type chip — the
 * client only has a sliced dict, so it would print the raw type id.
 */
export function localizeLocationLabels<
  T extends { node: string; type: string; label: string },
>(
  list: T[],
  dict: Record<string, string> | undefined,
): (T & { typeLabel?: string })[] {
  if (!dict) return list;
  return list.map((loc) => {
    const key = [loc.node.split("@")[0], loc.type].find((k) => k && dict[k]);
    return {
      ...loc,
      ...(key && { label: resolveDict(dict, key) }),
      ...(dict[loc.type] && { typeLabel: resolveDict(dict, loc.type) }),
    };
  });
}
