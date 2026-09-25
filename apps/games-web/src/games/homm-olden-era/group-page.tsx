import { notFound } from "next/navigation";
import {
  fetchDatabaseIndex,
  fetchDbDict,
  fetchVersion,
  DEFAULT_LOCALE,
} from "@repo/lib";
import { resolveDict, resolveDictWithFallback } from "@/lib/db/resolve-dict";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { EntityGrid } from "@/lib/db/entity-grid";

const APP_NAME = "homm-olden-era";

export async function getGroupData(types: string[], groupId: string) {
  const database = await fetchDatabaseIndex(APP_NAME);
  const matching = database.filter((cat) => types.includes(cat.type));

  const hasGroup = matching.some((cat) =>
    cat.items.some((item) => item.groupId === groupId),
  );
  if (!hasGroup) return null;

  const filtered = matching
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => item.groupId === groupId),
    }))
    .filter((cat) => cat.items.length > 0);

  return filtered;
}

export async function GroupPageContent({
  groupId,
  section,
  sectionDictKey,
  types,
  groupLabelPrefix,
  locale = DEFAULT_LOCALE,
}: {
  groupId: string;
  section: string;
  sectionDictKey: string;
  types: string[];
  groupLabelPrefix: string;
  locale?: string;
}) {
  const [dict, entries, version] = await Promise.all([
    fetchDbDict(APP_NAME, locale),
    getGroupData(types, groupId),
    fetchVersion(APP_NAME),
  ]);

  if (!entries) notFound();

  const sectionLabel = resolveDict(dict, sectionDictKey);
  const groupLabel = groupLabelPrefix
    ? resolveDictWithFallback(dict, `${groupLabelPrefix}${groupId}`, groupId)
    : resolveDictWithFallback(dict, groupId, groupId);
  const iconsHash = version.more.icons;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Breadcrumb
          crumbs={[
            { label: sectionLabel, href: `/db/${section}` },
            { label: groupLabel },
          ]}
          locale={locale}
          dict={dict}
        />
        <h1 className="text-2xl font-bold mb-6">{groupLabel}</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <EntityGrid
          entries={entries}
          section={section}
          dict={dict}
          locale={locale}
          iconsHash={iconsHash}
          appName={APP_NAME}
        />
      </div>
    </>
  );
}
