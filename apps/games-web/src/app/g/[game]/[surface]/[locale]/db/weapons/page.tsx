import { type Metadata } from "next";
import Link from "next/link";
import {
  DEFAULT_LOCALE,
  fetchDatabase,
  getMetadataAlternates,
  localizePath,
  translate,
} from "@repo/lib";
import { getFullDbDictionary, getStaticDictionary } from "@repo/ui/dicts";
import { localizeProps } from "@/lib/db/resolve-dict";
import { JSONLDScript } from "@repo/ui/apps";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { getAppConfig } from "@/lib/get-app-config";
import { WeaponsGrid, type WeaponItem } from "@/games/once-human/weapons-grid";
import { onceHuman } from "@/configs/once-human";
import GenericSectionPage, {
  generateMetadata as genericSectionMetadata,
} from "../[section]/page";

// This static /db/weapons route exists for Once Human's bespoke weapons grid,
// but `weapons` is also a normal db-section slug for other games (e.g. Wuthering
// Waves). For any non–Once-Human app we delegate to the generic [section] page,
// which renders the section if the app defines it and 404s otherwise.
type PageProps = { params: Promise<{ locale?: string }> };

const TITLE = "All Weapons – The Hidden Gaming Lair";
const DESCRIPTION =
  "Browse all weapons in Once Human with stats, types, and rarities. Find the best weapons for your build and optimize your loadout.";

/** Page words in the locale (once-human UI dict `oh.weapons.*`; English fallback). */
function weaponsText(dict: Record<string, string>) {
  return {
    title: dict["oh.weapons.metaTitle"] ?? TITLE,
    description: dict["oh.weapons.metaDescription"] ?? DESCRIPTION,
    heading: dict["oh.weapons.title"] ?? "All Weapons",
    home: dict["ui.nav_home"] || "Home",
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const app = await getAppConfig();
  if (app.name !== "once-human") {
    const p = await params;
    return genericSectionMetadata({
      params: Promise.resolve({ ...p, section: "weapons" }),
    });
  }
  const { locale = DEFAULT_LOCALE } = await params;
  const { canonical, languageAlternates } = getMetadataAlternates(
    "/db/weapons",
    locale,
    onceHuman.supportedLocales,
  );
  const text = weaponsText(await getStaticDictionary("once-human", locale));
  return {
    title: text.title,
    description: text.description,
    alternates: { canonical, languages: languageAlternates },
    openGraph: {
      title: text.title,
      description: text.description,
      url: canonical,
    },
  };
}

export default async function WeaponsPage({ params }: PageProps) {
  const app = await getAppConfig();
  if (app.name !== "once-human") {
    const p = await params;
    return GenericSectionPage({
      params: Promise.resolve({ ...p, section: "weapons" }),
    });
  }
  const { locale = DEFAULT_LOCALE } = await params;
  const [database, dict] = await Promise.all([
    fetchDatabase("once-human"),
    getFullDbDictionary("once-human", locale),
  ]);
  const text = weaponsText(dict);
  const cat = database.find((c) => c.type === "weapon");
  const weapons: WeaponItem[] = (cat?.items ?? []).map((item) => ({
    id: item.id,
    icon: typeof item.icon === "string" ? item.icon : "",
    name:
      localizeProps(item.props as { name?: string }, item.id, dict).name ??
      item.id,
    quality: Number((item.props as { quality?: number }).quality ?? 1),
    durability: Number((item.props as { durability?: number }).durability ?? 0),
    weight: Number((item.props as { weight?: number }).weight ?? 0),
  }));

  return (
    <>
      <JSONLDScript
        json={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: text.title,
          description: text.description,
          url: "https://oncehuman.th.gl/db/weapons",
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: weapons.length,
            itemListElement: weapons.slice(0, 100).map((w, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: w.name,
              url: `https://oncehuman.th.gl/db/weapons#${w.id}`,
            })),
          },
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
              name: text.home,
              item: "https://oncehuman.th.gl/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: text.heading,
              item: "https://oncehuman.th.gl/db/weapons",
            },
          ],
        }}
      />
      <HeaderOffset full>
        <ContentLayout
          id="once-human"
          header={
            <div className="space-y-3">
              <nav
                aria-label="Breadcrumb"
                className="text-xs text-muted-foreground"
              >
                <ol className="flex items-center gap-1">
                  <li>
                    <Link
                      href={localizePath("/", locale)}
                      className="hover:text-foreground transition-colors"
                    >
                      {text.home}
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li aria-current="page">{text.heading}</li>
                </ol>
              </nav>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {text.heading}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {translate(dict, "oh.weapons.summary", {
                    fallback: `${weapons.length} weapons across 5 rarities. Grouped by Legendary → Common.`,
                    vars: { count: String(weapons.length) },
                  })}
                </p>
              </div>
            </div>
          }
          content={
            <WeaponsGrid
              weapons={weapons}
              labels={{
                rarity: Object.fromEntries(
                  [1, 2, 3, 4, 5].flatMap((q) =>
                    dict[`oh.rarity.${q}`] ? [[q, dict[`oh.rarity.${q}`]]] : [],
                  ),
                ),
                durability: dict["oh.weapons.durability"],
                weight: dict["oh.weapons.weight"],
              }}
            />
          }
        />
      </HeaderOffset>
    </>
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
