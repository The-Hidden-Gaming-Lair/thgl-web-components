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
    ageUnknown: "New",
    copied: t("activeWorlds.copied"),
    codeReported: "Reported {ago} ago · click to copy",
    noCode: t("activeWorlds.noCode"),
    requestCode: "Request code",
    requestCodeHint:
      "Ask a player in this world to share its join code so you can hop in.",
    requestLimit:
      "You already have 3 active requests — wait for a code, or cancel one first.",
    codeRequested: "Requesting…",
    eventMap: "Event map",
    showMap: "Show map",
    showMapHint: "Show this world's event locations on the map above",
    lookingFor: "Looking for:",
    clearFilter: "Clear",
    zone: "Zone",
    zoneAll: "All zones",
    sort: "Sort",
    sortActive: "Recently active",
    sortOldest: "Oldest first",
    sortNewest: "Newest first",
    noneMatch: "No active worlds with the selected events right now.",
    noMapTitle: "No event locations on the map yet",
    noMapBody:
      "No exact locations reported for this world yet. Its events are live, but a player running the companion app has to pass near them to pin them on the map — play with the app open to help fill it in.",
    pending: {
      pendingTitle: "Your code requests",
      pendingWaiting: "Waiting for a player to share the code…",
      pendingWaitingHint:
        "A player in this world gets a prompt to share its join code. More players in-world = faster.",
      pendingReporters: "in world",
      pendingArrived: "Code ready — copied to your clipboard.",
      pendingExpired: "No code shared in time.",
      retry: "Try again",
      cancel: "Cancel request",
      copied: "Copied!",
      copyCode: "Copy code",
    },
    empty: t("activeWorlds.empty"),
    live: t("activeWorlds.live"),
    fetchError: t("activeWorlds.fetchError"),
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
              {(() => {
                // Link the "TH.GL companion apps" phrase to /companion-app. Falls
                // back to plain text for locales that translate it differently.
                const desc = t("activeWorlds.description");
                const phrase = "TH.GL companion apps";
                const i = desc.indexOf(phrase);
                if (i === -1) return <p className="text-sm">{desc}</p>;
                return (
                  <p className="text-sm">
                    {desc.slice(0, i)}
                    <a
                      href="https://www.th.gl/companion-app"
                      className="text-primary underline hover:no-underline"
                    >
                      {phrase}
                    </a>
                    {desc.slice(i + phrase.length)}
                  </p>
                );
              })()}
              <p className="mt-1 text-sm text-muted-foreground">
                🚧 This feature is a work in progress — we&apos;d love your
                feedback on{" "}
                <a
                  href="https://th.gl/discord"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline hover:no-underline"
                >
                  Discord
                </a>
                .
              </p>
            </>
          }
          content={<ActiveWorldsClient strings={strings} mapIcons={mapIcons} />}
        />
      </HeaderOffset>
    </>
  );
}
