import { translate, type AppConfig } from "@repo/lib";
import { resolveDict } from "./resolve-dict";

/**
 * Shared label + metadata builders for the generic `/db/[section]` routes.
 * Everything is driven by the section config and the entry's props shape —
 * never per-URL special cases. User-facing strings go through the UI dict
 * (`db.*` keys in packages/ui/src/dicts) with the English text as fallback.
 */

type Dict = Record<string, string>;
type SectionCfg = NonNullable<AppConfig["db"]>["homeSections"][number];

const t = (
  dict: Dict,
  key: string,
  fallback: string,
  vars?: Record<string, string | number>,
) =>
  translate(dict, key, {
    fallback,
    vars: vars
      ? Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, String(v)]))
      : undefined,
  });

/**
 * The section's display labels.
 * - `plural`: the section name shown in the nav, h1, breadcrumb and titles
 *   ("Paldeck", "Quests") — titleKey → internal-link title → titleFallback →
 *   `typeLabels` → dict term → slug.
 * - `singular`: what ONE entry is ("Pal", "Quest") — `typeLabels` passed
 *   through `singularize` (tenant labels are mixed singular/plural) → plural.
 */
export function getSectionLabels(
  appConfig: AppConfig,
  dict: Dict,
  secCfg: SectionCfg,
  section: string,
): { plural: string; singular: string } {
  const resolved = (key: string | undefined) => {
    if (!key) return undefined;
    const v = resolveDict(dict, key);
    return v && v !== key ? v : undefined;
  };
  const link = appConfig.internalLinks?.find((l) => l.href === secCfg.href);
  const rawTypeLabel = appConfig.db?.typeLabels?.[secCfg.type];
  // A typeLabel may be a dict key (Once Human); a resolved one is already the
  // singular in the page's locale, so it skips the English `singularize`.
  const localizedTypeLabel = resolved(rawTypeLabel);
  const typeLabel = localizedTypeLabel ?? rawTypeLabel;
  const plural =
    resolved(secCfg.titleKey) ??
    resolved(link?.title) ??
    secCfg.titleFallback ??
    resolved(`config.internalLinks.${section}.title`) ??
    typeLabel ??
    resolved(secCfg.type) ??
    section;
  return {
    plural,
    singular:
      localizedTypeLabel ?? (typeLabel ? singularize(typeLabel) : plural),
  };
}

/**
 * Most tenant `typeLabels` are plural ("Resonators", "Status Effects") although
 * titles want what ONE entry is. Conservative English singular of the last
 * word; labels it can't handle safely ("Weapons & Tools", "Arcs (Weapons)",
 * "Miscellaneous", "Equipment") are returned unchanged.
 */
export function singularize(label: string): string {
  if (/[&()/]/.test(label)) return label;
  const m = /^(.*?)([A-Za-z]+)$/.exec(label);
  if (!m) return label;
  const [, head, word] = m as unknown as [string, string, string];
  let one = word;
  if (/[^aeiou]ies$/i.test(word)) one = word.slice(0, -3) + "y";
  else if (/(ch|sh|x|o|ss)es$/i.test(word)) one = word.slice(0, -2);
  else if (/(ss|us|is)$/i.test(word)) one = word;
  else if (/s$/.test(word) && word.length > 3) one = word.slice(0, -1);
  return head + one;
}

/** Clip to ~155 chars on a word boundary (Google's snippet width). */
export function clipDescription(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const atWord = cut.slice(0, cut.lastIndexOf(" "));
  return `${(atWord.length > max * 0.6 ? atWord : cut).replace(/[\s,;:.–—-]+$/, "")}…`;
}

/** Localized Yes/No for boolean prop values. */
export function formatBool(dict: Dict | undefined, v: boolean): string {
  return v ? t(dict ?? {}, "db.yes", "Yes") : t(dict ?? {}, "db.no", "No");
}

type Ref = { id?: string; name?: string; count?: number };
const refList = (v: unknown): Ref[] => {
  if (Array.isArray(v)) return v.filter((r) => r && typeof r === "object");
  if (v && typeof v === "object") {
    const o = v as { list?: unknown; id?: unknown };
    if (Array.isArray(o.list)) return o.list as Ref[];
    if (typeof o.id === "string") return [o as Ref];
  }
  return [];
};

/** Props that never make a good meta snippet (structured / rendered elsewhere). */
const SKIP_STAT_KEYS = new Set([
  "region",
  "regionId",
  "category",
  "categoryId",
  "rarity",
  "icon",
]);

// The game's own prop label (`prop.<key>`) when the dict has one, as on the page.
const humanizeKey = (k: string, dict: Dict) =>
  dict[`prop.${k}`]
    ? resolveDict(dict, `prop.${k}`)
    : k
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/^./, (c) => c.toUpperCase());

function isCraftRecipe(p: Record<string, unknown>): boolean {
  return refList(p.ingredients).length > 0;
}

/**
 * Search-friendly entry title.
 * - Craftable entries (have `ingredients`): "How to Craft <Name> – Ingredients
 *   & Station | <Game>" — matches the "how to craft X" query intent.
 * - Otherwise "<Name> – <Section singular> | <Game> Database", shortened
 *   (drop " Database", then the section) when it would exceed ~65 chars.
 */
export function buildEntityTitle({
  dict,
  name,
  singular,
  game,
  props,
}: {
  dict: Dict;
  name: string;
  singular: string;
  game: string;
  props?: Record<string, unknown>;
}): string {
  const p = props ?? {};
  if (isCraftRecipe(p)) {
    const station =
      p.craftable && typeof p.craftable === "object"
        ? (p.craftable as { station?: string }).station
        : undefined;
    const title = station
      ? t(
          dict,
          "db.meta.craftTitleStation",
          "How to Craft {{name}} – Ingredients & Station | {{game}}",
          { name, game },
        )
      : t(
          dict,
          "db.meta.craftTitle",
          "How to Craft {{name}} – Ingredients | {{game}}",
          { name, game },
        );
    if (title.length <= 80) return title;
  }
  const full = t(
    dict,
    "db.meta.entityTitle",
    "{{name}} – {{section}} | {{game}} Database",
    { name, section: singular, game },
  );
  if (full.length <= 65) return full;
  const noDb = t(
    dict,
    "db.meta.entityTitleShort",
    "{{name}} – {{section}} | {{game}}",
    { name, section: singular, game },
  );
  if (noDb.length <= 65) return noDb;
  return `${name} | ${game}`;
}

/**
 * Data-driven meta description (~155 chars): the entry's own description
 * text (or its longest prose prop), then how to obtain it (ingredients /
 * station / locations / vendors / drops), then its most meaningful short
 * stats. Localized scaffolding; data values stay as the data provides them.
 */
export function buildEntityDescription({
  dict,
  name,
  singular,
  game,
  desc,
  props,
}: {
  dict: Dict;
  name: string;
  singular: string;
  game: string;
  desc?: string;
  props?: Record<string, unknown>;
}): string {
  const p = props ?? {};
  // Localized name from the dict when present; the baked (English) ref name
  // otherwise.
  const refName = (r: Ref) =>
    (r.id && dict[r.id] ? resolveDict(dict, r.id) : r.name) || r.name || "";
  const names = (v: unknown, n = 3) =>
    refList(v).slice(0, n).map(refName).filter(Boolean).join(", ");
  const parts: string[] = [];

  // Lead: the recipe intent or "<Name> — <singular> in <Game>."
  const ingredients = refList(p.ingredients);
  if (ingredients.length) {
    const list = ingredients
      .slice(0, 4)
      .map((r) => {
        const n = refName(r);
        return typeof r.count === "number" && r.count > 1
          ? `${r.count}× ${n}`
          : n;
      })
      .filter(Boolean)
      .join(", ");
    parts.push(
      t(
        dict,
        "db.meta.craftDesc",
        "How to craft {{name}} in {{game}}: {{ingredients}}.",
        { name, game, ingredients: list },
      ),
    );
  } else {
    parts.push(
      t(dict, "db.meta.entityDesc", "{{name}} — {{section}} in {{game}}.", {
        name,
        section: singular,
        game,
      }),
    );
  }

  // Provenance.
  const station =
    p.craftable && typeof p.craftable === "object"
      ? (p.craftable as { station?: string }).station
      : undefined;
  // The station may be a dict key (Aniimo's "Farmland (Lv. 2)"), like a ref name.
  if (station)
    parts.push(
      t(dict, "db.meta.craftedAt", "Crafted at {{station}}.", {
        station: dict[station] ? resolveDict(dict, station) : station,
      }),
    );
  const loc = p.locations as
    | { total?: number; noun?: string; nounPlural?: string }
    | undefined;
  if (
    loc &&
    typeof loc === "object" &&
    typeof loc.total === "number" &&
    loc.total > 0
  ) {
    const noun =
      loc.total === 1
        ? (loc.noun ?? t(dict, "db.location", "location"))
        : (loc.nounPlural ?? t(dict, "db.locations", "locations"));
    parts.push(
      t(dict, "db.meta.foundAt", "Found at {{count}} {{noun}}.", {
        count: loc.total,
        noun,
      }),
    );
  }
  const soldBy = names(p.soldBy);
  if (soldBy)
    parts.push(
      t(dict, "db.meta.soldBy", "Sold by {{names}}.", { names: soldBy }),
    );
  const droppedBy = names(p.droppedBy);
  if (droppedBy)
    parts.push(
      t(dict, "db.meta.droppedBy", "Dropped by {{names}}.", {
        names: droppedBy,
      }),
    );
  const drops = names(p.drops);
  if (drops)
    parts.push(t(dict, "db.meta.drops", "Drops {{names}}.", { names: drops }));

  // The entry's own text (after the short provenance facts, so they survive
  // the ~155-char clip): its description, else the longest prose prop
  // (e.g. a Diablo IV unique's `power`).
  const prose = Object.entries(p)
    .filter(
      ([k, v]) => !k.startsWith("_") && typeof v === "string" && v.length > 40,
    )
    .map(([, v]) => v as string)
    .sort((a, b) => b.length - a.length)[0];
  let text = desc?.trim();
  // Quoted flavour text says less than a mechanical prose prop (a unique's
  // power, an item's effect) — prefer the latter when both exist.
  if (!text || (prose && /^["“„«]/.test(text))) text = prose ?? text;
  if (text) {
    // Strip data-side markup like [X] placeholders / <tags>.
    const plain = text
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    parts.push(/[.!?…]$/.test(plain) ? plain : `${plain}.`);
  }

  // Most meaningful short stats: numbers first, then short strings/booleans.
  const stats = Object.entries(p)
    .filter(
      ([k, v]) =>
        !k.startsWith("_") &&
        !SKIP_STAT_KEYS.has(k) &&
        (typeof v === "number" ||
          typeof v === "boolean" ||
          (typeof v === "string" && v.length > 0 && v.length <= 24)),
    )
    .sort(
      ([, a], [, b]) =>
        Number(typeof b === "number") - Number(typeof a === "number"),
    )
    .slice(0, 3)
    .map(
      ([k, v]) =>
        `${humanizeKey(k, dict)}: ${typeof v === "boolean" ? formatBool(dict, v) : String(v)}`,
    );
  if (stats.length) parts.push(`${stats.join(", ")}.`);

  return clipDescription(parts.join(" "));
}

/** "<Section>: All N Entries | <Game> Database" for /db/<section>. */
export function buildSectionTitle(
  dict: Dict,
  label: string,
  count: number,
  game: string,
): string {
  return t(
    dict,
    "db.meta.sectionTitle",
    "{{section}}: All {{count}} Entries | {{game}} Database",
    {
      section: label,
      count: count.toLocaleString("en-US"),
      game,
    },
  );
}

/** Section meta description naming a few example entries. */
export function buildSectionDescription(
  dict: Dict,
  label: string,
  count: number,
  game: string,
  examples: string[],
): string {
  const base = t(
    dict,
    "db.meta.sectionDesc",
    "Browse all {{count}} {{section}} in the {{game}} database with stats, sources and locations.",
    {
      section: label,
      count: count.toLocaleString("en-US"),
      game,
    },
  );
  const ex = examples.filter(Boolean).slice(0, 4).join(", ");
  return clipDescription(
    ex
      ? `${base} ${t(dict, "db.meta.includes", "Includes {{names}} and more.", { names: ex })}`
      : base,
  );
}
