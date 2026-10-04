import {
  DATA_FORGE_CDN_URL,
  fetchDatabaseIndex,
  resolveForgeUrl,
  type BreedingData,
} from "@repo/lib";
import { resolveDict } from "@/lib/db/resolve-dict";

/**
 * Breeding calculator data — for tenants that ship `config/breeding.json`
 * (Palworld, data-forge `components.breeding.ts`). Pages 404 elsewhere.
 */
export async function fetchBreedingData(
  appName: string,
): Promise<BreedingData | null> {
  const res = await fetch(
    await resolveForgeUrl(
      `${DATA_FORGE_CDN_URL}/${appName}/config/breeding.json`,
    ),
    { next: { revalidate: 300 } },
  );
  if (!res.ok) return null;
  return res.json();
}

export type BreedingPalInfo = {
  id: string;
  name: string;
  icon?: { url: string; x: number; y: number; width: number; height: number };
  elements: string[];
  rarity: number;
  dex: string;
};

/** Localized name + paldeck icon per breeding pal, sorted by paldex number. */
export async function getBreedingPals(
  appName: string,
  data: BreedingData,
  dict: Record<string, string>,
): Promise<BreedingPalInfo[]> {
  const index = await fetchDatabaseIndex(appName).catch(() => []);
  const icons = new Map(
    index
      .filter((cat) => cat.type === "paldeck")
      .flatMap((cat) => cat.items.map((i) => [i.id, i.icon] as const)),
  );
  return Object.entries(data.pals)
    .map(([id, p]) => ({
      id,
      name: resolveDict(dict, id),
      icon: icons.get(id) as BreedingPalInfo["icon"],
      elements: p.elements,
      rarity: p.rarity,
      dex: p.dex,
    }))
    .sort(
      (a, b) => parseInt(a.dex) - parseInt(b.dex) || a.dex.localeCompare(b.dex),
    );
}

/** The `breeding.*` UI strings of a locale (sent to the client component). */
export function breedingLabels(dict: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(dict).filter(([k]) => k.startsWith("breeding.")),
  );
}
