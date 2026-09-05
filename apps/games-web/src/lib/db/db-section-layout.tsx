import {
  fetchDatabaseIndex,
  fetchDict,
  fetchVersion,
  getIconsUrl,
  type AppConfig,
} from "@repo/lib";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { DetailSidebarClient } from "./detail-sidebar-client";
import { resolveDict, resolveDictWithFallback } from "./resolve-dict";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Build the per-section sidebar groups: for each entry-type in `types`,
 * resolve item icon URLs (via the version-hashed icons sprite) and group
 * either by entry-type (when multiple types are passed) or by item.groupId.
 *
 * Pure data — return value is JSON-serializable so the sidebar can be a
 * client component.
 */
export async function buildSidebarGroups({
  appConfig,
  types,
  groupLabelPrefix,
  locale = "en",
  nameLabelPrefixByType,
}: {
  appConfig: AppConfig;
  types: string[];
  groupLabelPrefix: string;
  locale?: string;
  nameLabelPrefixByType?: Record<string, string>;
}) {
  const [dict, database, version] = await Promise.all([
    fetchDict(appConfig.name, locale),
    fetchDatabaseIndex(appConfig.name),
    fetchVersion(appConfig.name),
  ]);

  const sidebarData = database.filter((item) => types.includes(item.type));
  const hasMultipleTypes = new Set(sidebarData.map((e) => e.type)).size > 1;

  const groups = new Map<
    string,
    { id: string; name: string; icon?: IconSprite }[]
  >();

  for (const entry of sidebarData) {
    for (const item of entry.items) {
      const groupKey = hasMultipleTypes
        ? entry.type
        : (item.groupId ?? "other");
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      const rawIcon =
        item.icon && typeof item.icon === "object"
          ? (item.icon as IconSprite)
          : undefined;
      const icon = rawIcon
        ? {
            url: getIconsUrl(appConfig.name, rawIcon.url, version.more.icons),
            x: rawIcon.x,
            y: rawIcon.y,
            width: rawIcon.width,
            height: rawIcon.height,
          }
        : undefined;
      const namePrefix = nameLabelPrefixByType?.[entry.type] ?? "";
      const dictKey = namePrefix ? `${namePrefix}${item.id}` : item.id;
      groups.get(groupKey)!.push({
        id: item.id,
        name: resolveDict(dict, dictKey),
        icon,
      });
    }
  }

  // Sort groups to match the order in `types` when grouping by type
  const sortedEntries = hasMultipleTypes
    ? [...groups.entries()].sort(
        (a, b) => types.indexOf(a[0]) - types.indexOf(b[0]),
      )
    : [...groups.entries()];

  // A section whose items have no groupId collapses to a single "other"
  // bucket — show it as a flat list (no useless "Other" header) rather than
  // labelling it.
  const soleOther =
    sortedEntries.length === 1 && sortedEntries[0][0] === "other";

  return sortedEntries.map(([groupId, items]) => ({
    label: soleOther
      ? ""
      : groupLabelPrefix
        ? resolveDictWithFallback(
            dict,
            `${groupLabelPrefix}${groupId}`,
            groupId,
          )
        : resolveDictWithFallback(dict, groupId, groupId),
    // Sort entries alphabetically by display name (natural order so "Cave 2"
    // precedes "Cave 10"). The DB emits them in id order, which reads as random.
    items: [...items].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    ),
  }));
}

/**
 * Server component: fetches the database, builds the sidebar groups, and
 * renders the standard /db/<section> layout (sidebar + content + ads).
 *
 * Sections can override the sidebar entirely by passing `sidebar` directly.
 */
export async function DbSectionLayout({
  children,
  appConfig,
  section,
  types,
  groupLabelPrefix,
  locale = "en",
  nameLabelPrefixByType,
  sidebar,
}: {
  children: React.ReactNode;
  appConfig: AppConfig;
  section: string;
  types: string[];
  groupLabelPrefix: string;
  locale?: string;
  nameLabelPrefixByType?: Record<string, string>;
  sidebar?: React.ReactNode;
}) {
  const resolvedSidebar = sidebar ?? (
    <DetailSidebarClient
      groups={await buildSidebarGroups({
        appConfig,
        types,
        groupLabelPrefix,
        locale,
        nameLabelPrefixByType,
      })}
      section={section}
      locale={locale}
    />
  );

  return (
    <HeaderOffset full>
      <ContentLayout
        id={appConfig.name}
        sidebar={resolvedSidebar}
        header={null}
        content={children}
      />
    </HeaderOffset>
  );
}
