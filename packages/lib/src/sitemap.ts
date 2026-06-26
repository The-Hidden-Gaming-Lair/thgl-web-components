import type { MetadataRoute } from "next";
import {
  AppConfig,
  DatabaseConfig,
  fetchDatabase,
  fetchDatabaseIndex,
  fetchDict,
  fetchVersion,
  getAppUrl,
} from "./config";
import { DEFAULT_LOCALE, localizePath, translate } from "./i18n";
import { decodeFromBuffer } from "./cbor";
import { type Spawn } from "./coordinates";

/**
 * Resolve the database snapshot for sitemap walks. Prefer the slim
 * `database.index.json` (homm, others that split their data) but fall
 * back to the full `database.json` for games that ship a single file
 * (BPSR). Treat a network failure on both as "empty database" so the
 * sitemap continues to render the non-DB chunks.
 */
async function fetchDatabaseForSitemap(
  appName: string,
): Promise<DatabaseConfig> {
  try {
    return await fetchDatabaseIndex(appName);
  } catch {
    try {
      return await fetchDatabase(appName);
    } catch {
      return [];
    }
  }
}

type NodesCoordinates = {
  type: string;
  static?: boolean;
  mapName?: string;
  spawns: (Omit<Spawn, "type" | "id"> & { id?: string })[];
}[];

type NamedMarker = {
  mapTitle: string;
  typeName: string;
  displayName: string;
  nodeId: string;
};

// Each entry generates ~(1 + locales) URL entries with alternates XML.
// Keep each sitemap chunk small (~15MB) — well under common CDN/response
// size limits and fast to generate per request in the container.
const ENTRIES_PER_CHUNK = 150;

export function createRobots(appConfig: AppConfig) {
  return function (): MetadataRoute.Robots {
    return {
      rules: {
        userAgent: "*",
        disallow: "/nodes/",
      },
      sitemap: `https://${appConfig.domain}.th.gl/sitemap.xml`,
    };
  };
}

/** Load dictionaries for all supported locales */
async function loadAllDicts(
  appName: string,
  locales: string[],
): Promise<Map<string, Record<string, string>>> {
  const dicts = new Map<string, Record<string, string>>();
  const results = await Promise.all(
    locales.map(async (locale) => {
      try {
        const dict = await fetchDict(appName, locale);
        return [locale, dict] as const;
      } catch {
        return null;
      }
    }),
  );
  for (const result of results) {
    if (result) dicts.set(result[0], result[1]);
  }
  return dicts;
}

function createHelpers(
  appConfig: AppConfig,
  allDicts?: Map<string, Record<string, string>>,
) {
  const baseUrl = `https://${appConfig.domain}.th.gl`;
  const locales = appConfig.supportedLocales;
  const hasLocales = locales.length > 1;

  /**
   * Build alternates for a path.
   * If `localizedPathFn` is provided, each locale gets a custom translated path.
   * Otherwise, the same path is used with a locale prefix.
   */
  const getAlternates = (
    path: string,
    localizedPathFn?: (locale: string) => string | null,
  ): MetadataRoute.Sitemap[number]["alternates"] | undefined => {
    const canonical = `${baseUrl}${path}`;

    if (!hasLocales) return undefined;

    const languages = Object.fromEntries([
      ...locales.map((locale) => {
        if (localizedPathFn && locale !== DEFAULT_LOCALE) {
          const lp = localizedPathFn(locale);
          if (lp) return [locale, `${baseUrl}${localizePath(lp, locale)}`];
        }
        return [
          locale,
          locale === DEFAULT_LOCALE
            ? canonical
            : `${baseUrl}${localizePath(path, locale)}`,
        ];
      }),
      ["x-default", canonical],
    ]);
    return { languages };
  };

  const now = new Date();

  /**
   * Add a sitemap entry. For entries with translated slugs (guides, markers),
   * pass `localizedPathFn` to generate per-locale paths with translated names.
   */
  const addEntry = (
    entries: Map<string, MetadataRoute.Sitemap[number]>,
    path: string,
    opts: {
      changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
      priority: number;
      /** Return locale-specific path for translated slug URLs */
      localizedPathFn?: (locale: string) => string | null;
    },
  ) => {
    const alternates = getAlternates(path, opts.localizedPathFn);

    const canonicalUrl = baseUrl + path;
    if (!entries.has(canonicalUrl)) {
      entries.set(canonicalUrl, {
        url: canonicalUrl,
        lastModified: now,
        changeFrequency: opts.changeFrequency,
        priority: opts.priority,
        alternates,
      });
    }

    if (hasLocales) {
      for (const locale of locales) {
        if (locale === DEFAULT_LOCALE) continue;
        let localePath: string;
        if (opts.localizedPathFn) {
          const lp = opts.localizedPathFn(locale);
          localePath = localizePath(lp ?? path, locale);
        } else {
          localePath = localizePath(path, locale);
        }
        const localeUrl = baseUrl + localePath;
        if (!entries.has(localeUrl)) {
          entries.set(localeUrl, {
            url: localeUrl,
            lastModified: now,
            changeFrequency: opts.changeFrequency,
            priority: opts.priority,
            alternates,
          });
        }
      }
    }
  };

  return { baseUrl, locales, hasLocales, addEntry, allDicts };
}

/** Fetch and collect all named markers across all maps */
async function collectNamedMarkers(
  appConfig: AppConfig,
  version: Awaited<ReturnType<typeof fetchVersion>>,
  enDict: Record<string, string>,
): Promise<NamedMarker[]> {
  const mapNames = Object.keys(version.data.tiles);
  const markers: NamedMarker[] = [];

  for (const mapName of mapNames) {
    const nodesPath = version.more.nodes[mapName];
    if (!nodesPath) continue;

    try {
      const url = getAppUrl(appConfig.name, nodesPath);
      const response = await fetch(url);
      if (!response.ok) continue;

      const buffer = await response.arrayBuffer();
      const nodes = decodeFromBuffer<NodesCoordinates>(new Uint8Array(buffer));
      const mapTitle = translate(enDict, mapName);

      // Deduplicate by display name per type
      const seen = new Set<string>();

      for (const node of nodes) {
        const typeName = translate(enDict, node.type);

        for (const spawn of node.spawns) {
          // Only include spawns with a unique ID (not type@coords format)
          if (!spawn.id || spawn.id.includes("@")) continue;
          const rawId = (spawn.name ?? spawn.id).replace(/my_\d+_/, "");
          const displayName = translate(enDict, rawId);
          if (displayName === rawId || displayName === typeName) continue;

          const key = `${typeName}/${displayName}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const nodeId = `${spawn.id}@${spawn.p[0]}:${spawn.p[1]}`;

          markers.push({ mapTitle, typeName, displayName, nodeId });
        }
      }
    } catch (err) {
      console.error(`Failed to load nodes for sitemap (${mapName}):`, err);
    }
  }

  return markers;
}

/** Helper to translate a term with a specific locale dictionary, falling back to English */
function translateForLocale(
  allDicts: Map<string, Record<string, string>> | undefined,
  enDict: Record<string, string>,
  locale: string,
  key: string,
): string {
  if (locale === DEFAULT_LOCALE) return translate(enDict, key);
  const dict = allDicts?.get(locale);
  if (!dict) return translate(enDict, key);
  return translate(dict, key);
}

export function createSitemapIndex(appConfig: AppConfig) {
  const baseUrl = `https://${appConfig.domain}.th.gl`;

  return async function GET() {
    const [version, enDict] = await Promise.all([
      fetchVersion(appConfig.name),
      fetchDict(appConfig.name),
    ]);

    const guideCount = countGuideEntries(version, enDict);
    const guideChunks =
      guideCount > 0 ? Math.ceil(guideCount / ENTRIES_PER_CHUNK) : 0;
    const markers = await collectNamedMarkers(appConfig, version, enDict);
    const markerChunks =
      markers.length > 0 ? Math.ceil(markers.length / ENTRIES_PER_CHUNK) : 0;

    let dbChunks = 0;
    if (appConfig.db) {
      const database = await fetchDatabaseForSitemap(appConfig.name).catch(
        () => [] as DatabaseConfig,
      );
      const resolveSection = buildSectionResolver(appConfig);
      const dbEntries = collectDbEntries(database, resolveSection);
      dbChunks =
        dbEntries.length > 0
          ? Math.ceil(dbEntries.length / ENTRIES_PER_CHUNK)
          : 0;
    }

    const totalSitemaps = 1 + guideChunks + markerChunks + dbChunks;

    const now = new Date().toISOString();
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...Array.from(
        { length: totalSitemaps },
        (_, i) =>
          `  <sitemap>\n    <loc>${baseUrl}/sitemap/${i}.xml</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`,
      ),
      "</sitemapindex>",
    ].join("\n");

    return new Response(xml, {
      headers: { "Content-Type": "application/xml" },
    });
  };
}

/**
 * Build a resolver that maps each database entry `cat.type` to its public
 * `/db` URL segment. Driven by `appConfig.db.homeSections` — supports
 * both exact-match (`type`, `extraTypes`) and prefix-match (`typePrefix`)
 * so games like BPSR can declare one section over many subcategory types
 * (`dictionary_*`, `reading_books_*`, `story_episode_*`).
 *
 * Returns `null` for any type not declared by a section.
 */
function buildSectionResolver(
  appConfig: AppConfig,
): (catType: string) => string | null {
  const sections = appConfig.db?.homeSections ?? [];
  const exact = new Map<string, string>();
  const prefixes: Array<{ prefix: string; segment: string }> = [];
  for (const section of sections) {
    const segment = section.href.replace(/^\/db\//, "").replace(/\/.*$/, "");
    exact.set(section.type, segment);
    for (const extra of section.extraTypes ?? []) exact.set(extra, segment);
    if (section.typePrefix) {
      prefixes.push({ prefix: section.typePrefix, segment });
    }
  }
  return (catType) => {
    if (exact.has(catType)) return exact.get(catType)!;
    for (const { prefix, segment } of prefixes) {
      if (catType.startsWith(prefix)) return segment;
    }
    return null;
  };
}

/** Collect every (section, entityId) pair that has a detail page. */
function collectDbEntries(
  database: DatabaseConfig,
  resolveSection: (catType: string) => string | null,
): { section: string; id: string }[] {
  const entries: { section: string; id: string }[] = [];
  for (const cat of database) {
    if (cat.type.startsWith("_")) continue;
    // item_sets share routes with `items` (/db/artifacts/<id>); skip to
    // avoid double-emitting the same URL via two categories.
    if (cat.type === "item_sets") continue;
    const section = resolveSection(cat.type);
    if (!section) continue;
    for (const item of cat.items) {
      entries.push({ section, id: item.id });
    }
  }
  return entries;
}

/** Unique (section, groupId) pairs for `/db/<section>/<groupId>` pages. */
function collectDbGroupPages(
  database: DatabaseConfig,
  resolveSection: (catType: string) => string | null,
): { section: string; groupId: string }[] {
  const seen = new Set<string>();
  const entries: { section: string; groupId: string }[] = [];
  for (const cat of database) {
    if (cat.type.startsWith("_")) continue;
    const section = resolveSection(cat.type);
    if (!section) continue;
    for (const item of cat.items) {
      const gid = item.groupId;
      if (!gid) continue;
      const key = `${section}/${gid}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push({ section, groupId: gid });
    }
  }
  return entries;
}

/**
 * Count total guide entries (the /guides index, plus dedup'd group and type
 * pages). Returns 0 when there are no filters so DB-only games don't get
 * an empty shard allocated for them.
 */
function countGuideEntries(
  version: Awaited<ReturnType<typeof fetchVersion>>,
  enDict: Record<string, string>,
): number {
  if (version.data.filters.length === 0) return 0;
  const seenLabels = new Set<string>();
  let count = 1; // /guides index page
  const seenGroups = new Set<string>();
  for (const filter of version.data.filters) {
    const enGroup = translate(enDict, filter.group);
    if (!seenGroups.has(enGroup)) {
      seenGroups.add(enGroup);
      count++;
    }
    for (const v of filter.values) {
      const enLabel = translate(enDict, v.id);
      if (!seenLabels.has(enLabel)) {
        seenLabels.add(enLabel);
        count++;
      }
    }
  }
  return count;
}

export function createGenerateSitemaps(appConfig: AppConfig) {
  return async function generateSitemaps() {
    const [version, enDict] = await Promise.all([
      fetchVersion(appConfig.name),
      fetchDict(appConfig.name),
    ]);

    const guideCount = countGuideEntries(version, enDict);
    const guideChunks =
      guideCount > 0 ? Math.ceil(guideCount / ENTRIES_PER_CHUNK) : 0;
    const markers = await collectNamedMarkers(appConfig, version, enDict);
    const markerChunks =
      markers.length > 0 ? Math.ceil(markers.length / ENTRIES_PER_CHUNK) : 0;

    let dbChunks = 0;
    if (appConfig.db) {
      const database = await fetchDatabaseForSitemap(appConfig.name).catch(
        () => [] as DatabaseConfig,
      );
      const resolveSection = buildSectionResolver(appConfig);
      const dbEntries = collectDbEntries(database, resolveSection);
      dbChunks =
        dbEntries.length > 0
          ? Math.ceil(dbEntries.length / ENTRIES_PER_CHUNK)
          : 0;
    }

    // id 0 = core pages (home, maps, links, db group pages),
    // id 1..guideChunks = guides, then markers, then db detail pages
    const total = 1 + guideChunks + markerChunks + dbChunks;
    return Array.from({ length: total }, (_, i) => ({ id: i }));
  };
}

export function createSitemap(appConfig: AppConfig) {
  return async function sitemap(
    props?: { id: Promise<string> } | undefined,
  ): Promise<MetadataRoute.Sitemap> {
    const id = props?.id ? Number(await props.id) : 0;

    const [version, enDict] = await Promise.all([
      fetchVersion(appConfig.name),
      fetchDict(appConfig.name),
    ]);

    // Load all locale dictionaries for translated slug URLs
    const locales = appConfig.supportedLocales;
    const hasLocales = locales.length > 1;
    const allDicts = hasLocales
      ? await loadAllDicts(appConfig.name, locales)
      : undefined;

    const { addEntry } = createHelpers(appConfig, allDicts);
    const entries = new Map<string, MetadataRoute.Sitemap[number]>();

    // Determine chunk boundaries
    const guideCount = countGuideEntries(version, enDict);
    const guideChunks =
      guideCount > 0 ? Math.ceil(guideCount / ENTRIES_PER_CHUNK) : 0;
    const markerStartId = 1 + guideChunks;
    // Marker count drives the offset for DB chunks
    const markersForCount = await collectNamedMarkers(
      appConfig,
      version,
      enDict,
    );
    const markerChunks =
      markersForCount.length > 0
        ? Math.ceil(markersForCount.length / ENTRIES_PER_CHUNK)
        : 0;
    const dbStartId = markerStartId + markerChunks;
    const resolveSection = appConfig.db
      ? buildSectionResolver(appConfig)
      : () => null;

    if (id === 0) {
      // Core pages: home, maps, internal links (no guides — they have their own chunks)
      const mapNames = Object.keys(version.data.tiles);

      addEntry(entries, "/", {
        changeFrequency: "daily",
        priority: 0.9,
      });

      if (mapNames.length > 0) {
        addEntry(entries, "/maps", {
          changeFrequency: "daily",
          priority: 0.8,
        });
      }

      for (const mapName of mapNames) {
        const enTitle = translate(enDict, mapName);
        const path = `/maps/${encodeURIComponent(enTitle)}`;
        addEntry(entries, path, {
          changeFrequency: "daily",
          priority: 1,
          localizedPathFn: (locale) => {
            const title = translateForLocale(allDicts, enDict, locale, mapName);
            return `/maps/${encodeURIComponent(title)}`;
          },
        });
      }

      for (const link of appConfig.internalLinks || []) {
        const path = link.href.replaceAll(/&/g, "%26");
        const url = `https://${appConfig.domain}.th.gl` + path;
        if (!entries.has(url)) {
          addEntry(entries, path, {
            changeFrequency: "daily",
            priority: 0.8,
          });
        }
      }

      // DB-mode extras: group pages (e.g. /db/spells/day) and the
      // item-sets landing page. Detail pages live in the dedicated
      // dbChunks range below.
      if (appConfig.db) {
        // The /db landing and each /db/<section> listing. Driven by
        // db.homeSections so hybrid games that don't repeat sections in
        // internalLinks still get them (addEntry dedups against internalLinks).
        addEntry(entries, "/db", {
          changeFrequency: "weekly",
          priority: 0.8,
        });
        for (const section of appConfig.db.homeSections) {
          addEntry(entries, section.href, {
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
        const database = await fetchDatabaseForSitemap(appConfig.name).catch(
          () => [] as DatabaseConfig,
        );
        const groupPages = collectDbGroupPages(database, resolveSection);
        for (const { section, groupId } of groupPages) {
          addEntry(entries, `/db/${section}/${encodeURIComponent(groupId)}`, {
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
        // Only emit /db/artifacts/sets when the artifacts section exists,
        // so other future DB games don't get a dangling 404 entry.
        const hasArtifacts = appConfig.db.homeSections.some(
          (s) => s.href === "/db/artifacts",
        );
        if (hasArtifacts) {
          addEntry(entries, "/db/artifacts/sets", {
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }
    } else if (id < markerStartId) {
      // Guide chunk
      const guideChunkIndex = id - 1;
      const allGuideEntries: {
        path: string;
        priority: number;
        localizedPathFn: (locale: string) => string;
      }[] = [];

      if (version.data.filters.length > 0) {
        allGuideEntries.push({
          path: "/guides",
          priority: 0.7,
          localizedPathFn: () => "/guides",
        });

        const seenGroups = new Set<string>();
        const seenTypes = new Set<string>();

        for (const filter of version.data.filters) {
          const enGroupTitle = translate(enDict, filter.group);
          if (!seenGroups.has(enGroupTitle)) {
            seenGroups.add(enGroupTitle);
            allGuideEntries.push({
              path: `/guides/${encodeURIComponent(enGroupTitle)}`,
              priority: 0.6,
              localizedPathFn: (locale) => {
                const title = translateForLocale(
                  allDicts,
                  enDict,
                  locale,
                  filter.group,
                );
                return `/guides/${encodeURIComponent(title)}`;
              },
            });
          }

          for (const value of filter.values) {
            const enTypeTitle = translate(enDict, value.id);
            if (!seenTypes.has(enTypeTitle)) {
              seenTypes.add(enTypeTitle);
              allGuideEntries.push({
                path: `/guides/${encodeURIComponent(enTypeTitle)}`,
                priority: 0.5,
                localizedPathFn: (locale) => {
                  const title = translateForLocale(
                    allDicts,
                    enDict,
                    locale,
                    value.id,
                  );
                  return `/guides/${encodeURIComponent(title)}`;
                },
              });
            }
          }
        }
      }

      const start = guideChunkIndex * ENTRIES_PER_CHUNK;
      const chunk = allGuideEntries.slice(start, start + ENTRIES_PER_CHUNK);

      for (const entry of chunk) {
        addEntry(entries, entry.path, {
          changeFrequency: "weekly",
          priority: entry.priority,
          localizedPathFn: entry.localizedPathFn,
        });
      }
    } else if (id < dbStartId) {
      // Marker chunk
      const markers = await collectNamedMarkers(appConfig, version, enDict);
      const markerChunkIndex = id - markerStartId;
      const start = markerChunkIndex * ENTRIES_PER_CHUNK;
      const chunk = markers.slice(start, start + ENTRIES_PER_CHUNK);

      for (const { mapTitle, typeName, displayName, nodeId } of chunk) {
        const markerPath = `/maps/${encodeURIComponent(mapTitle)}/${encodeURIComponent(typeName)}/${encodeURIComponent(displayName)}?id=${encodeURIComponent(nodeId)}`;

        // Extract raw keys for translation
        // We need to find the original dict keys from the English translations
        const mapKey = Object.entries(enDict).find(
          ([, v]) => v === mapTitle,
        )?.[0];
        const typeKey = Object.entries(enDict).find(
          ([, v]) => v === typeName,
        )?.[0];
        const nameKey = Object.entries(enDict).find(
          ([, v]) => v === displayName,
        )?.[0];

        addEntry(entries, markerPath, {
          changeFrequency: "weekly",
          priority: 0.6,
          localizedPathFn:
            mapKey && typeKey && nameKey
              ? (locale) => {
                  const lMap = translateForLocale(
                    allDicts,
                    enDict,
                    locale,
                    mapKey,
                  );
                  const lType = translateForLocale(
                    allDicts,
                    enDict,
                    locale,
                    typeKey,
                  );
                  const lName = translateForLocale(
                    allDicts,
                    enDict,
                    locale,
                    nameKey,
                  );
                  return `/maps/${encodeURIComponent(lMap)}/${encodeURIComponent(lType)}/${encodeURIComponent(lName)}?id=${encodeURIComponent(nodeId)}`;
                }
              : undefined,
        });
      }
    } else if (appConfig.db) {
      // DB detail-page chunk: one entry per database entity id.
      const database = await fetchDatabaseForSitemap(appConfig.name).catch(
        () => [] as DatabaseConfig,
      );
      const dbEntries = collectDbEntries(database, resolveSection);
      const dbChunkIndex = id - dbStartId;
      const start = dbChunkIndex * ENTRIES_PER_CHUNK;
      const chunk = dbEntries.slice(start, start + ENTRIES_PER_CHUNK);

      for (const { section, id: entityId } of chunk) {
        addEntry(entries, `/db/${section}/${encodeURIComponent(entityId)}`, {
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }

    return Array.from(entries.values());
  };
}
