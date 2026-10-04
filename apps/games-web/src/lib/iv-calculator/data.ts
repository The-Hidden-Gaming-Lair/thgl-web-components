import {
  DATA_FORGE_CDN_URL,
  fetchDatabaseIndex,
  resolveForgeUrl,
  type PalStatsData,
} from "@repo/lib";
import { resolveDict } from "@/lib/db/resolve-dict";
import type { PickerPal } from "@/lib/breeding/calculator";

/**
 * IV calculator data — for tenants that ship `config/stats.json` (Palworld,
 * data-forge `components.stats.ts`). Pages 404 elsewhere.
 */
export async function fetchStatsData(
  appName: string,
): Promise<PalStatsData | null> {
  const res = await fetch(
    await resolveForgeUrl(`${DATA_FORGE_CDN_URL}/${appName}/config/stats.json`),
    { next: { revalidate: 300 } },
  );
  if (!res.ok) return null;
  return res.json();
}

/** Localized name + paldeck icon per pal, sorted by paldex number. */
export async function getStatsPals(
  appName: string,
  data: PalStatsData,
  dict: Record<string, string>,
): Promise<PickerPal[]> {
  const index = await fetchDatabaseIndex(appName).catch(() => []);
  const icons = new Map(
    index
      .filter((cat) => cat.type === "paldeck")
      .flatMap((cat) => cat.items.map((i) => [i.id, i.icon] as const)),
  );
  return Object.entries(data.pals)
    .filter(([id]) => icons.has(id))
    .map(([id, p]) => ({
      id,
      name: resolveDict(dict, id),
      icon: icons.get(id) as PickerPal["icon"],
      dex: p.dex,
    }))
    .sort(
      (a, b) => parseInt(a.dex) - parseInt(b.dex) || a.dex.localeCompare(b.dex),
    );
}

/** The `iv.*` UI strings + the locale's passive names (sent to the client). */
export function ivLabels(
  dict: Record<string, string>,
  data: PalStatsData,
  locale: string,
) {
  return {
    ...Object.fromEntries(
      Object.entries(dict).filter(([k]) => k.startsWith("iv.")),
    ),
    ...(data.terms.en ?? {}),
    ...(data.terms[locale] ?? {}),
  };
}
