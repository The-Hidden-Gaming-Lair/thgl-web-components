import { type Metadata } from "next";
import {
  fetchDatabaseIndex,
  fetchDbDict,
  fetchVersion,
  DEFAULT_LOCALE,
} from "@repo/lib";
import { generateCategoryMetadata } from "@/games/homm-olden-era/metadata";
import { requireApp } from "@/lib/get-app-config";
import { resolveDict } from "@/lib/db/resolve-dict";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { EntityGrid } from "@/lib/db/entity-grid";
import { SectionJsonLd } from "@/lib/db/section-jsonld";

type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  await requireApp("homm-olden-era");
  const { locale = DEFAULT_LOCALE } = await params;
  return generateCategoryMetadata(locale, "factions");
}

export default async function Page({ params }: PageProps) {
  const appConfig = await requireApp("homm-olden-era");
  const { locale = DEFAULT_LOCALE } = await params;
  const [dict, database, version] = await Promise.all([
    fetchDbDict(appConfig.name, locale),
    fetchDatabaseIndex(appConfig.name),
    fetchVersion(appConfig.name),
  ]);

  const factions = database.filter((item) => item.type === "factions");
  const specializations = database.filter(
    (item) => item.type === "specializations",
  );
  const factionLaws = database.filter((item) => item.type === "faction_laws");
  const sectionLabel = resolveDict(dict, "factions");
  const iconsHash = version.more.icons;

  return (
    <>
      <SectionJsonLd
        appConfig={appConfig}
        section="factions"
        sectionLabel={sectionLabel}
        description={`Browse all ${sectionLabel.toLowerCase()} in ${appConfig.title}.`}
        dict={dict}
        database={database}
        types={["factions", "specializations", "faction_laws"]}
        nameLabelPrefixByType={{ factions: "faction_" }}
        locale={locale}
      />
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Breadcrumb
          crumbs={[{ label: sectionLabel }]}
          locale={locale}
          dict={dict}
        />
        <h1 className="text-2xl font-bold mb-6">{sectionLabel}</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <EntityGrid
          entries={factions}
          section="factions"
          dict={dict}
          locale={locale}
          nameLabelPrefix="faction_"
          iconsHash={iconsHash}
          appName={appConfig.name}
        />

        <h2 className="text-lg font-semibold mt-8 mb-4">
          {resolveDict(dict, "specializations")}
        </h2>
        <EntityGrid
          entries={specializations}
          section="factions"
          dict={dict}
          locale={locale}
          groupLabelPrefix="faction_"
          iconsHash={iconsHash}
          appName={appConfig.name}
        />

        <h2 className="text-lg font-semibold mt-8 mb-4">
          {resolveDict(dict, "faction_laws")}
        </h2>
        <EntityGrid
          entries={factionLaws}
          section="factions"
          dict={dict}
          locale={locale}
          groupLabelPrefix="faction_"
          iconsHash={iconsHash}
          appName={appConfig.name}
        />
      </div>
    </>
  );
}
