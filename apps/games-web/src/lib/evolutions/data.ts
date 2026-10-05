import {
  DATA_FORGE_CDN_URL,
  encodeMapFilterParam,
  fetchDatabaseIndex,
  fetchDict,
  localizePath,
  resolveForgeUrl,
  translate,
  type EvolutionsData,
  type IconSprite,
  type Version,
} from "@repo/lib";
import { fetchSummary } from "@/lib/db/entry-extras";
import { resolveDict } from "@/lib/db/resolve-dict";

/**
 * Evolution guide data — for tenants that ship `config/evolutions.json`
 * (Aniimo, data-forge `aniimo/components.ts` → `evolutions`). Pages 404 elsewhere.
 */
export async function fetchEvolutionsData(
  appName: string,
): Promise<EvolutionsData | null> {
  const res = await fetch(
    await resolveForgeUrl(
      `${DATA_FORGE_CDN_URL}/${appName}/config/evolutions.json`,
    ),
    { next: { revalidate: 300 } },
  );
  if (!res.ok) return null;
  return res.json();
}

export type EvoEntity = { id: string; name: string; icon?: IconSprite };

/** Localized names + codex icons of every species and item the guide shows. */
export type EvolutionNames = {
  species: Record<string, EvoEntity>;
  items: Record<string, EvoEntity>;
};

export async function getEvolutionNames(
  appName: string,
  data: EvolutionsData,
  dict: Record<string, string>,
): Promise<EvolutionNames> {
  const index = await fetchDatabaseIndex(appName).catch(() => []);
  const bySection = (type: string) => {
    const out: Record<string, EvoEntity> = {};
    for (const cat of index)
      if (cat.type === type)
        for (const i of cat.items)
          out[i.id] = {
            id: i.id,
            name: resolveDict(dict, i.id) || i.id,
            icon: i.icon as IconSprite | undefined,
          };
    return out;
  };
  const species = bySection("aniimo");
  for (const id of Object.keys(data.species))
    species[id] ??= { id, name: resolveDict(dict, id) || id };
  return { species, items: bySection("items") };
}

/**
 * `/maps/<map>?filters=…` with only this Aniimo's spawn type on, opening the
 * map that holds its spawns (same choice as the codex "On the map" block);
 * null when it has no plotted spawns.
 */
export async function speciesMapHref(
  appName: string,
  id: string,
  version: Version,
  locale: string,
): Promise<string | null> {
  const filters = version.data.filters;
  if ((version.counts?.byType?.[id] ?? 0) === 0) return null;
  const summary = await fetchSummary(appName, `type=${id}`);
  if (!summary?.count) return null;
  const tiles = version.data.tiles;
  const tileNames = Object.keys(tiles);
  const maps = summary.maps
    .map((m) => m || tileNames[0])
    .filter((m) => m && tiles[m])
    .sort((a, b) => tileNames.indexOf(a) - tileNames.indexOf(b));
  const mapName = maps[0];
  if (!mapName) return null;
  const gameDict = await fetchDict(appName, locale).catch(
    () => ({}) as Record<string, string>,
  );
  const title =
    tiles[mapName]?.defaultTitle || resolveDict(gameDict, mapName) || mapName;
  const param = encodeMapFilterParam(filters, [id]);
  return `${localizePath(`/maps/${encodeURIComponent(title)}`, locale)}${
    param ? `?filters=${encodeURIComponent(param)}` : ""
  }`;
}

/** The `evo.*` UI strings with `{{vars}}` filled in. */
export function evoLabel(dict: Record<string, string>) {
  return (key: string, vars?: Record<string, string>) =>
    translate(dict, `evo.${key}`, vars ? { vars } : undefined);
}
