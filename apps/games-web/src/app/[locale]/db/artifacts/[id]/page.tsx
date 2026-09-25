import { type Metadata } from "next";
import Link from "next/link";
import { fetchDatabaseType, DEFAULT_LOCALE, localizePath } from "@repo/lib";
import { getFullDbDictionary } from "@repo/ui/dicts";
import {
  generateEntryMetadata,
  generateGroupMetadata,
} from "@/games/homm-olden-era/metadata";
import { requireApp } from "@/lib/get-app-config";
import { resolveDict } from "@/lib/db/resolve-dict";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { EntityTooltip } from "@/lib/db/entity-tooltip";
import { DatabaseEntryContent } from "@/games/homm-olden-era/database-entry";
import {
  getGroupData,
  GroupPageContent,
} from "@/games/homm-olden-era/group-page";

type Params = Promise<{ id: string; locale?: string }>;

const TYPES = ["items", "item_sets"];
const GROUP_PREFIX = "ui.slot_";
const SECTION = "artifacts";

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  await requireApp("homm-olden-era");
  const { id, locale = DEFAULT_LOCALE } = await params;
  if (id === "sets")
    return generateGroupMetadata(locale, SECTION, "item_sets", "", "item_sets");
  const groupData = await getGroupData(TYPES, id);
  if (groupData)
    return generateGroupMetadata(locale, SECTION, id, GROUP_PREFIX, SECTION);
  return generateEntryMetadata(locale, SECTION, id);
}

export default async function EntryPage({ params }: { params: Params }) {
  const appConfig = await requireApp("homm-olden-era");
  const { id, locale = DEFAULT_LOCALE } = await params;

  if (id === "sets") {
    const [dict, itemSets] = await Promise.all([
      getFullDbDictionary(appConfig.name, locale),
      fetchDatabaseType(appConfig.name, "item_sets"),
    ]);
    const sectionLabel = resolveDict(dict, "config.internalLinks.items.title");
    const setsLabel = resolveDict(dict, "item_sets");

    return (
      <>
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <Breadcrumb
            crumbs={[
              { label: sectionLabel, href: "/db/artifacts" },
              { label: setsLabel },
            ]}
            locale={locale}
            dict={dict}
          />
          <h1 className="text-2xl font-bold mb-6">{setsLabel}</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-6">
          {itemSets && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
          )}
        </div>
      </>
    );
  }

  const groupData = await getGroupData(TYPES, id);

  if (groupData) {
    return (
      <GroupPageContent
        groupId={id}
        section={SECTION}
        sectionDictKey="items"
        types={TYPES}
        groupLabelPrefix={GROUP_PREFIX}
        locale={locale}
      />
    );
  }

  const dict = await getFullDbDictionary(appConfig.name, locale);

  return (
    <>
      <Breadcrumb
        crumbs={[
          {
            label: resolveDict(dict, "config.internalLinks.items.title"),
            href: "/db/artifacts",
          },
          { label: resolveDict(dict, id) },
        ]}
        locale={locale}
        dict={dict}
      />
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <DatabaseEntryContent id={id} typePrefix="items" locale={locale} />
      </div>
    </>
  );
}
