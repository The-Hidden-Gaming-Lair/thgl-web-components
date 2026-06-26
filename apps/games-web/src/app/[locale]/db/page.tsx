import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, getMetadataAlternates } from "@repo/lib";
import { getAppConfig } from "@/lib/get-app-config";
import { createDbHomePage } from "@/lib/db/home-page";

/**
 * Generic `/db` database landing — the section-overview hub (hero stats, search,
 * a card per `db.homeSections`) for ANY tenant that defines `db` in its AppConfig.
 * Mirrors the `/maps` landing: hybrid games (map + database) link here via the
 * home page's "View all database" link. Reuses the same component the DB-only
 * games render at `/`, so no per-game code is needed.
 */
type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = await params;
  const appConfig = await getAppConfig();
  if (!appConfig.db) notFound();
  const title = `${appConfig.title} Database — The Hidden Gaming Lair`;
  const description = `Complete database for ${appConfig.title} — browse ${appConfig.keywords
    .slice(0, 4)
    .join(", ")
    .toLowerCase()} with stats, recipes and cross-references.`;
  const { canonical, languageAlternates } = getMetadataAlternates(
    "/db",
    locale,
    appConfig.supportedLocales,
  );
  return {
    title,
    description,
    alternates: { canonical, languages: languageAlternates },
    openGraph: {
      title,
      description,
      url: canonical,
      images: ["/opengraph-image.jpg"],
    },
  };
}

export default async function Page(props: PageProps) {
  const appConfig = await getAppConfig();
  if (!appConfig.db) notFound();
  return createDbHomePage(appConfig)(props);
}
