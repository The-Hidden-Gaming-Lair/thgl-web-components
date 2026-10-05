import { type Metadata } from "next";
import { DEFAULT_LOCALE, getMetadataAlternates } from "@repo/lib";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { requireApp } from "@/lib/get-app-config";
import { SavegameAnalyzer } from "@/games/songs-of-conquest/savegame-analyzer";

type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const appConfig = await requireApp("songs-of-conquest");
  const { locale = DEFAULT_LOCALE } = await params;
  const title = "Savegame Analyzer | Songs of Conquest";
  const description =
    "Upload a Songs of Conquest savegame to chart each team's army value, battles and economy round by round. Parsed entirely in your browser.";
  const { canonical, languageAlternates } = getMetadataAlternates(
    "/db/savegame",
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

export default async function SavegamePage() {
  const appConfig = await requireApp("songs-of-conquest");
  return (
    <HeaderOffset full>
      <ContentLayout
        id={appConfig.name}
        header={null}
        content={<SavegameAnalyzer />}
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
