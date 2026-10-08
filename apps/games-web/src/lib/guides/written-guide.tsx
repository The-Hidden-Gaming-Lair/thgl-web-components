import Link from "next/link";
import Script from "next/script";
import { type Metadata } from "next";
import {
  type AppConfig,
  type Guide,
  type GuideBlock,
  type IconSprite,
  type SimpleSpawn,
  DEFAULT_LOCALE,
  fetchDatabaseIndex,
  fetchDatabaseType,
  fetchGuidesIndex,
  fetchVersion,
  findMixedDbEntries,
  games,
  getIconsUrl,
  getT,
  hasGuideTracker,
  isSightingGuide,
  localizePath,
} from "@repo/lib";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { ArticleMarkdown, type ArticleLinkIcon } from "@repo/ui/content";
import { MapGuides, PageComments } from "@repo/ui/data";
import {
  JSONLDScript,
  getMixedEntries,
  MixedEntriesTables,
} from "@repo/ui/apps";
import { getFullDbDictionary, getFullDictionary } from "@repo/ui/dicts";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import { resolveDict } from "@/lib/db/resolve-dict";

/**
 * A written guide (data-forge `config/guides/<slug>.json`): editorial prose generated
 * from the game's own data, with embedded live maps and recipe cards. Served on
 * `/guides/<slug>` — the slug space is shared with the per-type location guides, which
 * this route falls back to when no written guide has the slug.
 */

/** `group`: alternatives for ONE ingredient slot (Palia "Any Fish": any one of them). */
type DbRef = { id: string; section: string; count?: number; group?: string };

/** Options of a grouped slot shown on the card; the rest link to the recipe's codex page. */
const GROUP_PREVIEW = 4;

/** Ingredient slots: refs sharing a `group` are one slot, every other ref its own. */
function ingredientSlots(refs: DbRef[]): DbRef[][] {
  const slots: DbRef[][] = [];
  const byGroup = new Map<string, DbRef[]>();
  for (const r of refs) {
    if (!r.group) {
      slots.push([r]);
      continue;
    }
    const slot = byGroup.get(r.group);
    if (slot) slot.push(r);
    else {
      const next = [r];
      byGroup.set(r.group, next);
      slots.push(next);
    }
  }
  return slots;
}
type DbEntry = { id: string; props?: Record<string, unknown> };

const guideUrl = (appConfig: AppConfig, slug: string) =>
  `https://${appConfig.domain}.th.gl/guides/${slug}`;

export function writtenGuideMetadata(
  appConfig: AppConfig,
  guide: Guide,
): Metadata {
  const url = guideUrl(appConfig, guide.slug);
  return {
    title: guide.title,
    description: guide.description,
    keywords: guide.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url,
      type: "article",
      images: ["/opengraph-image.jpg"],
    },
  };
}

async function loadEntry(
  appName: string,
  section: string,
  id: string,
): Promise<DbEntry | undefined> {
  const type = await fetchDatabaseType(appName, section).catch(() => null);
  return type?.items.find((i) => i.id === id) as DbEntry | undefined;
}

function RefChip({
  r,
  name,
  icon,
  appName,
  iconsHash,
}: {
  r: DbRef;
  name: string;
  icon?: IconSprite;
  appName: string;
  iconsHash?: string;
}) {
  return (
    <Link
      href={`/db/${r.section}/${encodeURIComponent(r.id)}`}
      className="inline-flex items-center gap-2 rounded-md border bg-card px-2 py-1 text-sm hover:bg-accent"
    >
      {icon && (
        <SpriteIcon
          icon={icon}
          appName={appName}
          size={28}
          iconsHash={iconsHash}
        />
      )}
      {(r.count ?? 1) > 1 && <span className="font-semibold">{r.count}×</span>}
      <span>{name}</span>
    </Link>
  );
}

async function RecipeCard({
  block,
  appName,
  dict,
  icons,
  iconsHash,
}: {
  block: Extract<GuideBlock, { type: "recipe" }>;
  appName: string;
  dict: Record<string, string>;
  icons: Record<string, IconSprite>;
  iconsHash?: string;
}) {
  const entry = await loadEntry(appName, block.section, block.id);
  if (!entry) return null;
  const props = entry.props ?? {};
  const ingredients = (props.ingredients as DbRef[] | undefined) ?? [];
  const products = (props.products as DbRef[] | undefined) ?? [
    { id: block.id, section: block.section },
  ];
  const station = (props.craftable as { station?: string } | undefined)
    ?.station;
  const name = (id: string) => resolveDict(dict, id) || id;
  return (
    <figure className="my-6 rounded-lg border bg-muted/30 p-4">
      <figcaption className="mb-3 text-sm text-muted-foreground">
        Recipe
        {station && (
          <>
            {" "}
            · Crafted at{" "}
            <strong className="text-foreground">
              {station.split(" / ").join(" or ")}
            </strong>
          </>
        )}
      </figcaption>
      <div className="flex flex-wrap items-center gap-2">
        {ingredientSlots(ingredients).map((slot, i) => (
          <span key={slot[0].id} className="inline-flex items-center gap-2">
            {i > 0 && <span className="text-muted-foreground">+</span>}
            {slot.length === 1 ? (
              <RefChip
                r={slot[0]}
                name={name(slot[0].id)}
                icon={icons[slot[0].id]}
                appName={appName}
                iconsHash={iconsHash}
              />
            ) : (
              <span className="inline-flex flex-wrap items-center gap-1.5 rounded-md border border-dashed px-2 py-1 text-sm">
                <span className="font-semibold">
                  {(slot[0].count ?? 1) > 1 ? `${slot[0].count}× ` : ""}
                  {slot[0].group}
                </span>
                <span className="text-muted-foreground">(any one of:</span>
                {slot.slice(0, GROUP_PREVIEW).map((r) => (
                  <RefChip
                    key={r.id}
                    r={{ ...r, count: undefined }}
                    name={name(r.id)}
                    icon={icons[r.id]}
                    appName={appName}
                    iconsHash={iconsHash}
                  />
                ))}
                {slot.length > GROUP_PREVIEW ? (
                  <Link
                    href={`/db/${block.section}/${encodeURIComponent(block.id)}`}
                    className="text-muted-foreground underline hover:text-foreground"
                  >
                    +{slot.length - GROUP_PREVIEW} more)
                  </Link>
                ) : (
                  <span className="text-muted-foreground">)</span>
                )}
              </span>
            )}
          </span>
        ))}
        <span className="px-1 text-muted-foreground" aria-label="makes">
          →
        </span>
        {products.map((r) => (
          <RefChip
            key={r.id}
            r={r}
            name={name(r.id)}
            icon={icons[r.id]}
            appName={appName}
            iconsHash={iconsHash}
          />
        ))}
      </div>
    </figure>
  );
}

export async function WrittenGuidePage({
  appConfig,
  guide,
}: {
  appConfig: AppConfig;
  guide: Guide;
}) {
  const locale = DEFAULT_LOCALE;
  const [dict, dbDict, version, index, guides] = await Promise.all([
    getFullDictionary(appConfig.name, locale),
    getFullDbDictionary(appConfig.name, locale),
    fetchVersion(appConfig.name),
    fetchDatabaseIndex(appConfig.name),
    fetchGuidesIndex(appConfig.name),
  ]);
  const t = getT(dict);
  const iconsHash = version.more.icons;
  const icons: Record<string, IconSprite> = {};
  for (const cat of index)
    for (const it of cat.items)
      if (it.icon && typeof it.icon === "object")
        icons[it.id] = it.icon as IconSprite;

  // Entry icon in front of every codex link in the prose (`/db/<section>/<id>`).
  const linkIcons: Record<string, ArticleLinkIcon> = {};
  for (const block of guide.blocks) {
    if (block.type !== "md") continue;
    for (const m of block.md.matchAll(/\]\((\/db\/[^/)]+\/([^)]+))\)/g)) {
      const icon = icons[decodeURIComponent(m[2])];
      if (icon)
        linkIcons[m[1]] = {
          src: icon.url.startsWith("http")
            ? icon.url
            : getIconsUrl(appConfig.name, icon.url, iconsHash),
          x: icon.x,
          y: icon.y,
          width: icon.width,
          height: icon.height,
        };
    }
  }

  const tileNames = Object.keys(version.data.tiles);
  const defaultMapName = tileNames[0] || "default";
  const filters = version.data.filters;
  const iconOf = (type: string) =>
    filters.flatMap((f) => f.values).find((v) => v.id === type)?.icon ?? null;
  const groupLabels: Record<string, string> = {};
  for (const f of filters)
    for (const v of f.values)
      groupLabels[v.id] ??= t(f.group, { fallback: f.group });

  const url = guideUrl(appConfig, guide.slug);
  const updated = new Date(guide.updated);
  const related = guides
    .filter(
      (g) =>
        g.slug !== guide.slug &&
        g.entities.some((e) => guide.entities.includes(e)),
    )
    .slice(0, 6);

  // A map block whose types mix several codex entries found in different places
  // (`mixedDbEntries`, Palia: Recipe: Fish Stew / Sashimi) shows each entry's own table
  // instead of a map that sends players to the wrong water.
  const mixedByBlock = await Promise.all(
    guide.blocks.map((block) =>
      block.type === "map"
        ? getMixedEntries(
            appConfig,
            locale,
            findMixedDbEntries(block.types, filters),
          )
        : [],
    ),
  );

  const renderBlock = (block: GuideBlock, i: number) => {
    switch (block.type) {
      case "md":
        return (
          <ArticleMarkdown key={i} linkIcons={linkIcons}>
            {block.md}
          </ArticleMarkdown>
        );
      case "map": {
        if (mixedByBlock[i].length > 0)
          return (
            <MixedEntriesTables
              key={i}
              intro={t("guide.mixed", {
                vars: { guide: block.types.map((type) => t(type)).join(", ") },
                fallback:
                  "{{guide}} markers can stand for any of the entries below, so the map would mix their spots. Here is where each one is found:",
              })}
              entries={mixedByBlock[i]}
            />
          );
        // Multi-map games: open on the map with the most spawns of these types.
        const blockMaps = (block.maps ?? []).filter((m) =>
          tileNames.includes(m),
        );
        const maps = blockMaps.length ? blockMaps : [defaultMapName];
        return (
          <div key={i} className="my-6">
            <MapGuides
              appName={appConfig.name}
              locale={locale}
              queries={block.types.map((type) => `type=${type}`)}
              typeLabels={Object.fromEntries(
                block.types.map((type) => [type, t(type)]),
              )}
              typeIcons={Object.fromEntries(
                block.types.map((type) => [
                  type,
                  iconOf(type) as SimpleSpawn["icon"],
                ]),
              )}
              localMapState
              iconsPath={iconsHash}
              defaultMapName={maps[0]}
              maps={maps}
              mapLabels={Object.fromEntries(maps.map((m) => [m, t(m)]))}
              tiles={version.data.tiles}
              additionalTooltip={
                games.find((g) => g.id === appConfig.name)?.additionalTooltip ??
                appConfig.game?.additionalTooltip
              }
              typeGroupLabels={groupLabels}
              tracker={
                !isSightingGuide(
                  block.types,
                  filters,
                  appConfig.sightingFilters,
                ) &&
                hasGuideTracker(block.types, filters, appConfig.trackerFilters)
              }
            />
          </div>
        );
      }
      case "recipe":
        return (
          <RecipeCard
            key={i}
            block={block}
            appName={appConfig.name}
            dict={dbDict}
            icons={icons}
            iconsHash={iconsHash}
          />
        );
      case "item":
        return (
          <div key={i} className="my-4">
            <RefChip
              r={block}
              name={resolveDict(dbDict, block.id) || block.id}
              icon={icons[block.id]}
              appName={appConfig.name}
              iconsHash={iconsHash}
            />
          </div>
        );
    }
  };

  return (
    <>
      <JSONLDScript
        json={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          description: guide.description,
          dateModified: updated.toISOString(),
          author: {
            "@type": "Organization",
            name: "The Hidden Gaming Lair",
            url: "https://www.th.gl",
          },
          publisher: {
            "@type": "Organization",
            name: "The Hidden Gaming Lair",
            url: "https://www.th.gl",
          },
          mainEntityOfPage: url,
        }}
      />
      <JSONLDScript
        json={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: `https://${appConfig.domain}.th.gl/`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Guides",
              item: `https://${appConfig.domain}.th.gl/guides`,
            },
            { "@type": "ListItem", position: 3, name: guide.title, item: url },
          ],
        }}
      />
      {/* Hover cards for every codex link (prose + recipe chips): our public
          tooltip script, hover-only — no link decoration on a React-owned DOM. */}
      <Script src="/tooltips.js" strategy="lazyOnload" />
      <HeaderOffset full>
        <ContentLayout
          id={appConfig.name}
          header={
            <div className="max-w-3xl mx-auto text-left">
              <nav
                aria-label="Breadcrumb"
                className="text-xs text-muted-foreground py-2"
              >
                <ol className="flex items-center gap-1">
                  <li>
                    <Link
                      href={localizePath("/", locale)}
                      className="hover:text-foreground transition-colors"
                    >
                      Home
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li>
                    <Link
                      href={localizePath("/guides", locale)}
                      className="hover:text-foreground transition-colors"
                    >
                      Guides
                    </Link>
                  </li>
                </ol>
              </nav>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight mt-2">
                {guide.title}
              </h1>
              <p className="text-lg text-muted-foreground mt-3">
                {guide.description}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Updated{" "}
                {updated.toLocaleDateString("en", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                · Every fact in this guide comes from the game&apos;s data
              </p>
            </div>
          }
          content={
            <>
              <article className="max-w-3xl mx-auto text-left">
                {guide.blocks.map(renderBlock)}
              </article>
              {related.length > 0 && (
                <aside className="max-w-3xl mx-auto mt-10 text-left">
                  <h2 className="text-xl font-bold border-b pb-2 mb-3">
                    Related guides
                  </h2>
                  <ul className="space-y-1">
                    {related.map((g) => (
                      <li key={g.slug}>
                        <Link
                          href={`/guides/${g.slug}`}
                          className="text-primary hover:underline"
                        >
                          {g.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </aside>
              )}
              <PageComments
                id={`guide:${guide.slug}`}
                appName={appConfig.name}
              />
            </>
          }
        />
      </HeaderOffset>
    </>
  );
}
