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
  return generateCategoryMetadata(locale, "map_objects");
}

export default async function Page({ params }: PageProps) {
  const appConfig = await requireApp("homm-olden-era");
  const { locale = DEFAULT_LOCALE } = await params;
  const [dict, database, version] = await Promise.all([
    fetchDbDict(appConfig.name, locale),
    fetchDatabaseIndex(appConfig.name),
    fetchVersion(appConfig.name),
  ]);
  const data = database.filter((item) => item.type === "map_objects");
  const sectionLabel = resolveDict(dict, "map_objects");
  const iconsHash = version.more.icons;

  return (
    <>
      <SectionJsonLd
        appConfig={appConfig}
        section="map-objects"
        sectionLabel={sectionLabel}
        description={`Browse all ${sectionLabel.toLowerCase()} in ${appConfig.title}.`}
        dict={dict}
        database={database}
        types={["map_objects"]}
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
          entries={data}
          section="map-objects"
          dict={dict}
          locale={locale}
          linkGroups
          iconsHash={iconsHash}
          appName={appConfig.name}
        />
      </div>
    </>
  );
}
