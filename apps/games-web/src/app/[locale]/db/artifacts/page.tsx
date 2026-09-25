import { type Metadata } from "next";
import Link from "next/link";
import {
  fetchDatabaseIndex,
  fetchDatabaseType,
  fetchVersion,
  DEFAULT_LOCALE,
  localizePath,
} from "@repo/lib";
import { getFullDbDictionary } from "@repo/ui/dicts";
import { generateCategoryMetadata } from "@/games/homm-olden-era/metadata";
import { requireApp } from "@/lib/get-app-config";
import { resolveDict } from "@/lib/db/resolve-dict";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { EntityGrid } from "@/lib/db/entity-grid";
import { EntityTooltip } from "@/lib/db/entity-tooltip";
import { SectionJsonLd } from "@/lib/db/section-jsonld";

type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  await requireApp("homm-olden-era");
  const { locale = DEFAULT_LOCALE } = await params;
  return generateCategoryMetadata(locale, "artifacts", "Artifacts");
}

export default async function Page({ params }: PageProps) {
  const appConfig = await requireApp("homm-olden-era");
  const { locale = DEFAULT_LOCALE } = await params;
  const [dict, index, itemSets, version] = await Promise.all([
    getFullDbDictionary(appConfig.name, locale),
    fetchDatabaseIndex(appConfig.name),
    fetchDatabaseType(appConfig.name, "item_sets"),
    fetchVersion(appConfig.name),
  ]);
  const items = index.filter((item) => item.type === "items");
  const sectionLabel = resolveDict(dict, "config.internalLinks.items.title");
  const iconsHash = version.more.icons;

  return (
    <>
      <SectionJsonLd
        appConfig={appConfig}
        section="artifacts"
        sectionLabel={sectionLabel}
        description={`Browse all ${sectionLabel.toLowerCase()} in ${appConfig.title}.`}
        dict={dict}
        database={[...items, ...(itemSets ? [itemSets] : [])]}
        types={["items", "item_sets"]}
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

      {itemSets && itemSets.items.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-6">
          <h2 className="text-lg font-semibold mb-3">
            <Link
              href={localizePath("/db/artifacts/sets", locale)}
              className="hover:text-amber-400 transition-colors"
            >
              {resolveDict(dict, "item_sets")}
              <span className="ml-2 text-sm text-muted-foreground font-normal">
                {itemSets.items.length}
              </span>
            </Link>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-8">
            {itemSets.items.map((set) => {
              const setName = resolveDict(dict, set.id);
              const memberCount = (set.props as any)?.itemsInSet?.length ?? 0;
              const bonusTiers = (set.props as any)?.bonuses?.length ?? 0;
              return (
                <EntityTooltip
                  key={set.id}
                  entityId={set.id}
                  locale={locale}
                  className="block"
                >
                  <Link
                    href={localizePath(`/db/artifacts/${set.id}`, locale)}
                    className="group block border border-slate-800 hover:border-amber-800/50 rounded-lg px-4 py-3 transition-all hover:bg-slate-900/50"
                  >
                    <div className="font-medium group-hover:text-amber-400 transition-colors">
                      {setName}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {memberCount} items · {bonusTiers} bonus{" "}
                      {bonusTiers === 1 ? "tier" : "tiers"}
                    </div>
                  </Link>
                </EntityTooltip>
              );
            })}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 pb-6">
        <EntityGrid
          entries={items}
          section="artifacts"
          dict={dict}
          locale={locale}
          groupLabelPrefix="ui.slot_"
          linkGroups
          iconsHash={iconsHash}
          appName={appConfig.name}
        />
      </div>
    </>
  );
}
