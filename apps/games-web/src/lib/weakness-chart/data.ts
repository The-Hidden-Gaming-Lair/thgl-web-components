import {
  DATA_FORGE_CDN_URL,
  fetchDatabaseIndex,
  resolveForgeUrl,
  type IconSprite,
  type WeaknessData,
} from "@repo/lib";
import { resolveDict } from "@/lib/db/resolve-dict";

/**
 * Weakness Chart data — for tenants that ship `config/weaknesses.json`
 * (Grounded 2, data-forge `grounded2/weaknesses.ts`). Pages 404 elsewhere.
 */
export async function fetchWeaknessData(
  appName: string,
): Promise<WeaknessData | null> {
  const res = await fetch(
    await resolveForgeUrl(
      `${DATA_FORGE_CDN_URL}/${appName}/config/weaknesses.json`,
    ),
    { next: { revalidate: 300 } },
  );
  if (!res.ok) return null;
  return res.json();
}

/** A codex entry as the chart shows it (name + icon + its /db section). */
export type WeaknessEntry = {
  id: string;
  name: string;
  section: string;
  icon?: IconSprite;
};

export type WeaknessNames = {
  /** Chart columns in display order, `id` = damage type id. */
  types: (WeaknessEntry & { typeId: string; desc?: string })[];
  /** Creatures sorted by name. */
  creatures: WeaknessEntry[];
  /** Damage type id → weapons dealing it, sorted by name. */
  weaponsByType: Record<string, WeaknessEntry[]>;
};

export async function getWeaknessNames(
  appName: string,
  data: WeaknessData,
  dict: Record<string, string>,
): Promise<WeaknessNames> {
  const index = await fetchDatabaseIndex(appName).catch(() => []);
  // Every codex id is unique across sections: id → its section + icon.
  const byId = new Map<string, { section: string; icon?: IconSprite }>();
  for (const cat of index)
    for (const item of cat.items)
      byId.set(item.id, {
        section: cat.type,
        icon: item.icon as IconSprite | undefined,
      });
  const entry = (id: string, fallbackSection: string): WeaknessEntry => ({
    id,
    name: resolveDict(dict, id),
    section: byId.get(id)?.section ?? fallbackSection,
    icon: byId.get(id)?.icon,
  });
  const byName = (a: WeaknessEntry, b: WeaknessEntry) =>
    a.name.localeCompare(b.name);

  const types = data.types.map((t) => {
    const desc = dict[`${t.entry}_desc`];
    return {
      ...entry(t.entry, "damage-types"),
      typeId: t.id,
      // Game rich-text tags (`<GlobalColor.Attention>wooziness</>`) dropped.
      desc: desc
        ? resolveDict(dict, `${t.entry}_desc`).replace(/<[^>]*>/g, "")
        : undefined,
    };
  });
  const creatures = Object.keys(data.creatures)
    .filter((id) => byId.has(id))
    .map((id) => entry(id, "creatures"))
    .sort(byName);
  const weaponsByType: Record<string, WeaknessEntry[]> = {};
  for (const [id, typeIds] of Object.entries(data.weapons ?? {})) {
    if (!byId.has(id)) continue;
    const weapon = entry(id, "weapons");
    for (const t of typeIds) (weaponsByType[t] ??= []).push(weapon);
  }
  for (const list of Object.values(weaponsByType)) list.sort(byName);
  return { types, creatures, weaponsByType };
}

/** The chart's UI strings (`weak.*`) for the client island. */
export function weaknessLabels(dict: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(dict).filter(([k]) => k.startsWith("weak.")),
  );
}
