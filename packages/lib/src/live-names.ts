import { DATA_FORGE_CDN_URL, fetchVersion } from "./config";

/**
 * Per-actor names for live types whose filter value stands for many different
 * things (filter value `liveNames: true`, e.g. Palia "Plot Items": one
 * `plot_item` filter, a name per placed decor class). data-forge writes them to
 * `config/live-names/<locale>.json`, keyed by the RAW actor type the app reports
 * (`BP_Decor_Couch_C_PLOT`). Kept out of the map dict, which ships whole to every
 * visitor: fetched only while such a filter is on. Cached per game + locale,
 * cache-busted by the data build (`version.more.contentHash`).
 */
const cache = new Map<string, Promise<Record<string, string>>>();

export function fetchLiveNames(
  appName: string,
  locale: string = "en",
): Promise<Record<string, string>> {
  const key = `${appName}:${locale}`;
  let names = cache.get(key);
  if (!names) {
    names = (async () => {
      const hash = await fetchVersion(appName)
        .then((version) => version.more.contentHash)
        .catch(() => undefined);
      const url = `${DATA_FORGE_CDN_URL}/${appName}/config/live-names/${locale}.json${hash ? `?v=${hash}` : ""}`;
      const res = await fetch(url);
      if (res.ok) return (await res.json()) as Record<string, string>;
      if (locale !== "en") return fetchLiveNames(appName, "en");
      throw new Error(`live names ${url}: ${res.status}`);
    })();
    names.catch(() => {
      if (cache.get(key) === names) cache.delete(key);
    });
    cache.set(key, names);
  }
  return names;
}
