import { type Metadata } from "next";
import {
  fetchDatabaseIndex,
  fetchDict,
  fetchVersion,
  DEFAULT_LOCALE,
} from "@repo/lib";
import { generateCategoryMetadata } from "@/games/homm-olden-era/metadata";
import { getAppConfig } from "@/lib/get-app-config";
import { resolveDict } from "@/lib/db/resolve-dict";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { EntityGrid } from "@/lib/db/entity-grid";
import { SectionJsonLd } from "@/lib/db/section-jsonld";
import GenericSectionPage, {
  generateMetadata as genericSectionMetadata,
} from "../[section]/page";

// This static /db/buildings route exists for HoMM: Olden Era's faction-grouped
// build trees, but `buildings` is also a normal db-section slug for other games
// (e.g. Planet Crafter, Grounded 2). For any non-HoMM app we delegate to the
// generic [section] page, which renders the section if the app defines it and
// 404s otherwise (same pattern as /db/weapons for Once Human).
type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const app = await getAppConfig();
  if (app.name !== "homm-olden-era") {
    const p = await params;
    return genericSectionMetadata({
      params: Promise.resolve({ ...p, section: "buildings" }),
    });
  }
  const { locale = DEFAULT_LOCALE } = await params;
  return generateCategoryMetadata(locale, "buildings");
}

export default async function Page({ params }: PageProps) {
  const appConfig = await getAppConfig();
  if (appConfig.name !== "homm-olden-era") {
    const p = await params;
    return GenericSectionPage({
      params: Promise.resolve({ ...p, section: "buildings" }),
    });
  }
  const { locale = DEFAULT_LOCALE } = await params;
  const [dict, database, version] = await Promise.all([
    fetchDict(appConfig.name, locale),
    fetchDatabaseIndex(appConfig.name),
    fetchVersion(appConfig.name),
  ]);
  const data = database.filter((item) => item.type === "buildings");
  const sectionLabel = resolveDict(dict, "buildings");
  const iconsHash = version.more.icons;

  return (
    <>
      <SectionJsonLd
        appConfig={appConfig}
        section="buildings"
        sectionLabel={sectionLabel}
        description={`Browse all ${sectionLabel.toLowerCase()} in ${appConfig.title}.`}
        dict={dict}
        database={database}
        types={["buildings"]}
        locale={locale}
      />
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Breadcrumb
          crumbs={[{ label: sectionLabel }]}
          locale={locale}
          dict={dict}
        />
        <h1 className="text-2xl font-bold mb-2">{sectionLabel}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Click a faction header to see its full build tree.
        </p>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <EntityGrid
          entries={data}
          section="buildings"
          dict={dict}
          locale={locale}
          groupLabelPrefix="faction_"
          linkGroups
          groupSection="factions"
          iconsHash={iconsHash}
          appName={appConfig.name}
        />
      </div>
    </>
  );
}
