import { type Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DEFAULT_LOCALE,
  fetchDatabaseIndex,
  fetchDialogueIndex,
  fetchVersion,
  getMetadataAlternates,
  translate,
  type AppConfig,
} from "@repo/lib";
import { getDbNamesDictionary } from "@repo/ui/dicts";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { getAppConfig } from "@/lib/get-app-config";
import { resolveDict } from "@/lib/db/resolve-dict";
import { QuotesSearch, type QuoteSpeaker } from "@/lib/db/quotes-search";

/**
 * /db/quotes — search every line the game's characters say (data-forge
 * lib/dialogue.ts). For tenants that list it in `internalLinks`; the corpus
 * itself is fetched in the browser.
 */
type PageProps = { params: Promise<{ locale?: string }> };

async function quotesApp(): Promise<AppConfig> {
  const appConfig = await getAppConfig();
  if (!appConfig.internalLinks?.some((l) => l.href === "/db/quotes"))
    notFound();
  return appConfig;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const appConfig = await quotesApp();
  const { locale = DEFAULT_LOCALE } = await params;
  const dict = await getDbNamesDictionary(appConfig.name, locale);
  const title = `${translate(dict, "db.quotes.title", { fallback: "Character Quotes" })} | ${appConfig.title}`;
  const description = translate(dict, "db.quotes.description", {
    fallback:
      "Search every line the characters say, with the player's reply options, and see who says what.",
  });
  const { canonical, languageAlternates } = getMetadataAlternates(
    "/db/quotes",
    locale,
    appConfig.supportedLocales,
  );
  return {
    title,
    description,
    alternates: { canonical, languages: languageAlternates },
    openGraph: { title, description, url: canonical },
  };
}

export default async function QuotesPage({ params }: PageProps) {
  const appConfig = await quotesApp();
  const { locale = DEFAULT_LOCALE } = await params;
  const [counts, index, dict, version] = await Promise.all([
    fetchDialogueIndex(appConfig.name),
    fetchDatabaseIndex(appConfig.name),
    getDbNamesDictionary(appConfig.name, locale),
    fetchVersion(appConfig.name),
  ]);
  // Each speaker's codex page: the home section that holds its type.
  const sectionOf = new Map<string, string>();
  for (const cat of index) {
    const sec = appConfig.db?.homeSections.find(
      (s) => s.type === cat.type || (s.extraTypes ?? []).includes(cat.type),
    );
    if (!sec) continue;
    for (const it of cat.items) sectionOf.set(it.id, sec.href);
  }
  const speakers: QuoteSpeaker[] = Object.entries(counts).map(([id, n]) => ({
    id,
    name: resolveDict(dict, id) || id,
    href: sectionOf.has(id) ? `${sectionOf.get(id)}/${id}` : undefined,
    count: n,
  }));
  if (!speakers.length) notFound();
  const labels = {
    title: translate(dict, "db.quotes.title", {
      fallback: "Character Quotes",
    }),
    intro: translate(dict, "db.quotes.intro", {
      fallback:
        "Search {{lines}} lines from {{count}} characters. The lines span the whole story, spoilers included.",
      vars: {
        lines: String(speakers.reduce((a, s) => a + s.count, 0)),
        count: String(speakers.length),
      },
    }),
    placeholder: translate(dict, "db.quotes.placeholder", {
      fallback: "Search a quote or a character…",
    }),
    loading: translate(dict, "db.quotes.loading", {
      fallback: "Loading the quotes…",
    }),
    hint: translate(dict, "db.quotes.hint", {
      fallback: "Type at least 3 letters.",
    }),
    results: translate(dict, "db.quotes.results", {
      fallback: "{{count}} lines",
    }),
    empty: translate(dict, "db.quotes.empty", {
      fallback: "No line matches.",
    }),
    error: translate(dict, "db.quotes.error", {
      fallback: "The quotes could not be loaded. Please reload the page.",
    }),
  };
  return (
    <HeaderOffset full>
      <ContentLayout
        id={appConfig.name}
        header={null}
        content={
          <QuotesSearch
            appName={appConfig.name}
            locale={locale}
            contentHash={version.more.contentHash}
            speakers={speakers}
            labels={labels}
          />
        }
      />
    </HeaderOffset>
  );
}

// Cached in Next's page cache (cache-handler.cjs): rendered once per pod and
// game data version, then served without re-rendering — see
// src/lib/route-params.ts. No dynamic APIs below this route; plain fetches stay
// uncached so a re-render after a data update always sees fresh data.
export const dynamic = "force-static";
export const fetchCache = "default-no-store";
export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}
