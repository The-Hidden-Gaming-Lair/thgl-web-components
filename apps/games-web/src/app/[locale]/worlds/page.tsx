import { HeaderOffset, PageTitle } from "@repo/ui/header";
import { type Metadata } from "next";
import { ContentLayout } from "@repo/ui/ads";
import { JSONLDScript } from "@repo/ui/apps";
import Link from "next/link";
import {
  DEFAULT_LOCALE,
  getT,
  getMetadataAlternates,
  localizePath,
  fetchVersion,
} from "@repo/lib";
import { getStaticDictionary } from "@repo/ui/dicts";
import { requireApp } from "@/lib/get-app-config";
import ActiveWorldsClient, {
  type ActiveWorldsStrings,
} from "@/games/palia/active-worlds-client";
import ActiveWorldsGate from "@/games/palia/active-worlds-gate";

type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const config = await requireApp("palia");
  const { locale = DEFAULT_LOCALE } = await params;
  const dict = await getStaticDictionary(config.name, locale);
  const t = getT(dict);

  const { canonical, languageAlternates } = getMetadataAlternates(
    "/worlds",
    locale,
    config.supportedLocales,
  );

  const title = t("activeWorlds.meta.title");
  const description = t("activeWorlds.meta.description");

  return {
    alternates: { canonical, languages: languageAlternates },
    title,
    description,
    openGraph: { title, description, url: canonical },
    // WIP / Elite-only preview — keep it out of search until it launches.
    robots: { index: false, follow: false },
  };
}

export default async function ActiveWorlds({ params }: PageProps) {
  const config = await requireApp("palia");
  const { locale = DEFAULT_LOCALE } = await params;
  const dict = await getStaticDictionary(config.name, locale);
  const t = getT(dict);

  const pageTitle = t("activeWorlds.meta.title");
  const pageDescription = t("activeWorlds.meta.description");

  // Map data for the per-world event-location preview (reuses the Palia tiles).
  // Resolve the real Flow-Tree / Palium marker icons from the live filter atlas
  // (by value id) so the preview matches the main interactive map exactly.
  const version = await fetchVersion(config.name);
  const iconById = (group: string, id: string) =>
    version.data.filters
      .find((f) => f.group === group)
      ?.values.find((v) => v.id === id)?.icon;
  const fallbackIcon = version.data.filters
    .find((f) => f.group === "players")!
    .values.find((v) => v.id === "other_player")!.icon;
  const mapIcons = {
    tiles: version.data.tiles,
    iconsPath: version.more.icons,
    bucketIcons: {
      flowTrees:
        iconById(
          "lumberjacking_magical",
          "Woodcutting.Oak.Large.Final.Magical",
        ) ?? fallbackIcon,
      palium: iconById("mining", "Mining.Palium.Medium.Final") ?? fallbackIcon,
    },
    fallbackIcon,
  };

  const strings: ActiveWorldsStrings = {
    worldId: t("activeWorlds.worldId"),
    age: t("activeWorlds.age"),
    lastReport: t("activeWorlds.lastReport"),
    reporters: t("activeWorlds.reporters"),
    activity: t("activeWorlds.activity"),
    activityFlowTrees: t("activeWorlds.activityFlowTrees"),
    activityPalium: t("activeWorlds.activityPalium"),
    activityLootPiles: t("activeWorlds.activityLootPiles"),
    ageUnknown: t("activeWorlds.ageUnknown"),
    copied: t("activeWorlds.copied"),
    noCode: t("activeWorlds.noCode"),
    requestCode: "Request code",
    requestCodeHint:
      "Ask a player in this world to share its join code so you can hop in.",
    codeRequested: "Requesting…",
    eventMap: "Event map",
    lookingFor: "Looking for:",
    clearFilter: "Clear",
    noneMatch: "No active worlds with the selected events right now.",
    noMapTitle: "No event locations on the map yet",
    noMapBody:
      "Worlds above show which events are live (Flow Trees, Palium), but exact map locations only appear once an app-user is standing near them in that world. Run the companion app while you play to put your world's events on the map.",
    pending: {
      pendingTitle: "Your code requests",
      pendingWaiting: "Waiting for a player to share the code…",
      pendingWaitingHint:
        "A player in this world gets a prompt to share its join code. More players in-world = faster.",
      pendingReporters: "in world",
      pendingArrived: "Code ready — copied to your clipboard.",
      pendingExpired:
        "No code shared in time. Try again or pick another world.",
      cancel: "Cancel request",
      copied: "Copied!",
      copyCode: "Copy code",
    },
    empty: t("activeWorlds.empty"),
    live: t("activeWorlds.live"),
    fetchError: t("activeWorlds.fetchError"),
    ctaTitle: "Find a world and jump in",
    ctaDescription:
      "The tracker is powered by players running the free TH.GL companion app while they play — it keeps this list live so you can find a world with the events you want and join it.",
    ctaStep1: "Get the companion app",
    ctaStep1Body:
      "Play with the app open and your world is added here automatically — no setup.",
    ctaStep2: "Find an active world",
    ctaStep2Body:
      "Browse worlds by region, age and live events like Flow Trees and Palium, shown on the map.",
    ctaStep3: "Request a join code",
    ctaStep3Body:
      "A player in that world gets a nudge to share the code — then copy it and join.",
    ctaButton: "Get the Companion App",
  };

  return (
    <>
      <JSONLDScript
        json={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: pageTitle,
          description: pageDescription,
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
          mainEntityOfPage: `https://palia.th.gl${localizePath("/worlds", locale)}`,
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
              item: `https://palia.th.gl${localizePath("/", locale)}`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: t("activeWorlds.heading"),
              item: `https://palia.th.gl${localizePath("/worlds", locale)}`,
            },
          ],
        }}
      />
      <HeaderOffset full>
        <PageTitle title={t("activeWorlds.heading")} />
        <nav
          aria-label="Breadcrumb"
          className="text-xs text-muted-foreground px-4 py-2"
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
            <li aria-current="page">{t("activeWorlds.heading")}</li>
          </ol>
        </nav>
        <ContentLayout
          id="palia"
          header={
            <>
              <h2 className="text-2xl">{t("activeWorlds.heading")}</h2>
              <p className="text-sm">{t("activeWorlds.description")}</p>
            </>
          }
          content={
            <ActiveWorldsGate title={t("activeWorlds.heading")}>
              <ActiveWorldsClient strings={strings} mapIcons={mapIcons} />
            </ActiveWorldsGate>
          }
        />
      </HeaderOffset>
    </>
  );
}
