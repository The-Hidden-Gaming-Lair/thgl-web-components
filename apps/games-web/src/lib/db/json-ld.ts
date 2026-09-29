import type { AppConfig } from "@repo/lib";

/**
 * Schema.org JSON-LD builders for DB pages. Kept out of the page
 * components so other DB games can reuse them without copying the
 * boilerplate.
 *
 * Each builder returns a plain JSON object suitable for `<JSONLDScript json={...}>`.
 */

function baseUrl(appConfig: AppConfig): string {
  return `https://${appConfig.domain}.th.gl`;
}

/**
 * Normalise the `section` argument to a leading-slash URL stem.
 * Accepts either:
 *   - a bare segment like `"units"` — expanded to `"/db/units"` for
 *     backwards compatibility with the homm callsites.
 *   - a full path like `"/db/dictionary"` or `"/remnants"` — used
 *     verbatim. This lets games that don't live under `/db/` (e.g.
 *     during a URL migration) reuse the same JSON-LD helpers.
 */
function sectionStem(section: string): string {
  return section.startsWith("/") ? section : `/db/${section}`;
}

/**
 * CollectionPage schema for `/db/<section>` listing pages.
 *
 * `items` is the list of entity entries shown on the page (id + display
 * name). The resulting JSON includes an `ItemList` `mainEntity` capped at
 * 100 entries — enough for Google's rich-result heuristics without
 * bloating the HTML for sections like Factions (326 items).
 */
export function collectionPageJsonLd({
  appConfig,
  section,
  sectionLabel,
  description,
  items,
  locale = "en",
}: {
  appConfig: AppConfig;
  /** URL segment under /db/ (e.g. "units") */
  section: string;
  /** Human-readable section title (already localized) */
  sectionLabel: string;
  /** Page description (already localized) */
  description: string;
  /** Entries displayed on this section page */
  items: Array<{ id: string; name: string }>;
  locale?: string;
}): Record<string, unknown> {
  const localePath = locale === "en" ? "" : `/${locale}`;
  const stem = sectionStem(section);
  const url = `${baseUrl(appConfig)}${localePath}${stem}`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${sectionLabel} | ${appConfig.title}`,
    description,
    url,
    inLanguage: locale,
    isPartOf: {
      "@type": "WebSite",
      name: `${appConfig.title} Database — The Hidden Gaming Lair`,
      url: baseUrl(appConfig),
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.slice(0, 100).map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        url: `${baseUrl(appConfig)}${localePath}${stem}/${encodeURIComponent(item.id)}`,
      })),
    },
  };
}

/**
 * Article schema for `/db/<section>/<id>` entity detail pages.
 *
 * Article is the most broadly-applicable type Google indexes for
 * game-database entries — it surfaces the page in search with the
 * description snippet. We use Article (not Thing/CreativeWork) so the
 * `headline`/`description` fields are first-class.
 */
export function entityPageJsonLd({
  appConfig,
  section,
  sectionLabel,
  entityId,
  entityName,
  description,
  locale = "en",
}: {
  appConfig: AppConfig;
  section: string;
  sectionLabel: string;
  entityId: string;
  entityName: string;
  /** May be empty when the entity has no description */
  description?: string;
  locale?: string;
}): Record<string, unknown> {
  const localePath = locale === "en" ? "" : `/${locale}`;
  const url = `${baseUrl(appConfig)}${localePath}${sectionStem(section)}/${encodeURIComponent(entityId)}`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${entityName} | ${sectionLabel} | ${appConfig.title}`,
    name: entityName,
    description:
      description?.trim() ||
      `${entityName} — ${sectionLabel} entry in ${appConfig.title}.`,
    url,
    inLanguage: locale,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    isPartOf: {
      "@type": "WebSite",
      name: `${appConfig.title} Database — The Hidden Gaming Lair`,
      url: baseUrl(appConfig),
    },
    publisher: {
      "@type": "Organization",
      name: "The Hidden Gaming Lair",
      url: "https://www.th.gl",
    },
    image: `${baseUrl(appConfig)}/opengraph-image.jpg`,
  };
}

/**
 * BreadcrumbList schema mirroring the visible `<Breadcrumb>` trail
 * (Home › Database › Section › Entry). `crumbs` excludes Home (added here);
 * the last crumb may omit `href` — it resolves to the current page `url`.
 */
export function breadcrumbJsonLd({
  appConfig,
  homeLabel,
  crumbs,
  url,
  locale = "en",
}: {
  appConfig: AppConfig;
  homeLabel: string;
  crumbs: Array<{ label: string; href?: string }>;
  /** Absolute URL of the current page (used for an href-less last crumb). */
  url: string;
  locale?: string;
}): Record<string, unknown> {
  const localePath = locale === "en" ? "" : `/${locale}`;
  const abs = (href: string) =>
    `${baseUrl(appConfig)}${localePath}${href === "/" ? "" : href}` ||
    baseUrl(appConfig);
  const all = [{ label: homeLabel, href: "/" }, ...crumbs];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: c.href ? abs(c.href) : url,
    })),
  };
}
