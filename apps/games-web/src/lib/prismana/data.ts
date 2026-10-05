import {
  DATA_FORGE_CDN_URL,
  fetchActivitiesConfig,
  fetchDatabaseEntry,
  fetchDatabaseIndex,
  localizePath,
  prismanaSpotPath,
  resolveForgeUrl,
  sortPrismanaSources,
  translate,
  type IconSprite,
  type PrismanaData,
} from "@repo/lib";
import { resolveDict } from "@/lib/db/resolve-dict";

/**
 * Prismana tracker data — for tenants that ship `config/prismana.json`
 * (Aniimo, data-forge `aniimo/components.ts` → `prismana`). The page 404s
 * elsewhere. Everything the client island renders is resolved here: names,
 * Prismana portraits, links and the game's texts in the page locale.
 */
export async function fetchPrismanaData(
  appName: string,
): Promise<PrismanaData | null> {
  const res = await fetch(
    await resolveForgeUrl(
      `${DATA_FORGE_CDN_URL}/${appName}/config/prismana.json`,
    ),
    { next: { revalidate: 300 } },
  );
  if (!res.ok) return null;
  return res.json();
}

export type PrismanaRef = {
  id: string;
  name: string;
  icon?: IconSprite;
  href?: string;
};

export type PrismanaSourceView =
  | { kind: "flow"; href: string }
  | { kind: "hidden"; href: string; weeks: number[] }
  | { kind: "egg"; egg: PrismanaRef; sources: string[] }
  | { kind: "evolve"; from: PrismanaRef }
  | { kind: "rv"; text: string };

export type PrismanaView = {
  entries: (PrismanaRef & { sources: PrismanaSourceView[] })[];
  weeks: {
    week: number;
    start: Record<string, number>;
    end: Record<string, number>;
    species: (PrismanaRef & { mapHref: string })[];
  }[];
  regions: { id: string; name: string; utcOffsetMinutes: number }[];
  stages: { stage: number; energy: number; chance: string }[];
  notes: string[];
  orb: PrismanaRef & { use: string; sources: string[] };
  mystery: PrismanaRef & { desc: string; sources: string[] };
};

/** Game strings carry `<style=…>` / `<sprite …>` rich-text tags — keep the text. */
function clean(text: string): string {
  return text.replace(/<[^>]+>/g, "").trim();
}

export async function getPrismanaView(
  appName: string,
  data: PrismanaData,
  dict: Record<string, string>,
  locale: string,
): Promise<PrismanaView> {
  const t = (key: string) => clean(resolveDict(dict, key) || key);
  const [index, activities] = await Promise.all([
    fetchDatabaseIndex(appName).catch(() => []),
    fetchActivitiesConfig(appName).catch(() => null),
  ]);
  const indexed = new Map<string, { type: string; icon?: IconSprite }>();
  for (const cat of index)
    for (const i of cat.items)
      indexed.set(i.id, {
        type: cat.type,
        icon: i.icon as IconSprite | undefined,
      });
  const ref = (id: string, icon?: IconSprite): PrismanaRef => {
    const hit = indexed.get(id);
    return {
      id,
      name: t(id),
      icon: icon ?? hit?.icon,
      href: hit ? localizePath(`/db/${hit.type}/${id}`, locale) : undefined,
    };
  };

  // The codex entry's "Prismana" variant portrait (gallery label = the form name).
  const PRISMANA_VARIANT = "Prismana";
  const portraits = new Map<string, IconSprite>();
  await Promise.all(
    data.prismana.map(async ({ id }) => {
      const entry = await fetchDatabaseEntry(appName, "aniimo", id);
      const variants = (entry?.props as { variants?: unknown } | undefined)
        ?.variants as { label: string; icon?: IconSprite }[] | undefined;
      const icon = variants?.find((v) => v.label === PRISMANA_VARIANT)?.icon;
      if (icon) portraits.set(id, icon);
    }),
  );
  const species = (id: string) => ref(id, portraits.get(id));
  const spot = (s: { node: string; map: string }) =>
    localizePath(prismanaSpotPath(s), locale);
  const regionTerms = {
    ...(activities?.terms?.en ?? {}),
    ...(activities?.terms?.[locale] ?? {}),
  };
  const regions = data.hidden.regions.map((id) => {
    const r = activities?.reset.regions.find((x) => x.id === id);
    return {
      id,
      name: (r && (regionTerms[r.name] || r.name)) || id,
      utcOffsetMinutes: r?.utcOffsetMinutes ?? 0,
    };
  });

  return {
    entries: data.prismana.map((p) => {
      const sources: PrismanaSourceView[] = [];
      for (const s of sortPrismanaSources(p.sources)) {
        if (s.kind === "flow") sources.push({ kind: "flow", href: spot(s) });
        else if (s.kind === "hidden")
          sources.push({ kind: "hidden", href: spot(s), weeks: s.weeks });
        else if (s.kind === "evolve")
          sources.push({ kind: "evolve", from: species(s.from) });
        else if (s.kind === "rv") sources.push({ kind: "rv", text: t(s.text) });
        else {
          // One line per egg, listing every place the game names for it.
          const egg = sources.find(
            (v): v is Extract<PrismanaSourceView, { kind: "egg" }> =>
              v.kind === "egg" && v.egg.id === s.item,
          );
          if (egg) egg.sources.push(t(s.source));
          else
            sources.push({
              kind: "egg",
              egg: ref(s.item),
              sources: [t(s.source)],
            });
        }
      }
      return { ...species(p.id), sources };
    }),
    weeks: [...data.hidden.weeks]
      .sort((a, b) => a.week - b.week)
      .map((w) => ({
        week: w.week,
        start: w.start,
        end: w.end,
        species: w.species.map((s) => ({
          ...species(s.id),
          mapHref: spot(s),
        })),
      })),
    regions,
    stages: data.flow.stages.map((s) => ({ ...s, chance: t(s.chance) })),
    notes: data.flow.notes.map(t),
    orb: {
      ...ref(data.orb.item),
      use: t(data.orb.use),
      sources: data.orb.sources.map(t),
    },
    mystery: {
      ...ref(data.mystery.item),
      desc: t(`${data.mystery.item}_desc`),
      sources: data.mystery.sources.map(t),
    },
  };
}

/** The `prismana.*` UI strings with `{{vars}}` filled in. */
export function prismanaLabel(dict: Record<string, string>) {
  return (key: string, vars?: Record<string, string>) =>
    translate(dict, `prismana.${key}`, vars ? { vars } : undefined);
}
