import {
  DEFAULT_LOCALE,
  fetchDatabaseIndex,
  fetchDbDict,
  fetchVersion,
  getIconsUrl,
} from "@repo/lib";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { requireApp } from "@/lib/get-app-config";
import { DetailSidebarClient } from "@/lib/db/detail-sidebar-client";
import { resolveDict, resolveDictWithFallback } from "@/lib/db/resolve-dict";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export default async function ArtifactsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const appConfig = await requireApp("homm-olden-era");
  const { locale = DEFAULT_LOCALE } = await params;
  const [dict, database, version] = await Promise.all([
    fetchDbDict(appConfig.name, locale),
    fetchDatabaseIndex(appConfig.name),
    fetchVersion(appConfig.name),
  ]);

  const items = database.filter((e) => e.type === "items");
  const itemSets = database.filter((e) => e.type === "item_sets");

  const groups: {
    label: string;
    items: { id: string; name: string; icon?: IconSprite }[];
  }[] = [];

  const slotGroups = new Map<
    string,
    { id: string; name: string; icon?: IconSprite }[]
  >();
  for (const entry of items) {
    for (const item of entry.items) {
      const groupKey = item.groupId ?? "other";
      if (!slotGroups.has(groupKey)) slotGroups.set(groupKey, []);
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
      slotGroups
        .get(groupKey)!
        .push({ id: item.id, name: resolveDict(dict, item.id), icon });
    }
  }

  if (itemSets.length > 0) {
    const setItems: { id: string; name: string; icon?: IconSprite }[] = [];
    for (const entry of itemSets) {
      for (const item of entry.items) {
        setItems.push({ id: item.id, name: resolveDict(dict, item.id) });
      }
    }
    groups.push({ label: resolveDict(dict, "item_sets"), items: setItems });
  }

  for (const [groupId, groupItems] of slotGroups) {
    groups.push({
      label: resolveDictWithFallback(dict, `ui.slot_${groupId}`, groupId),
      items: groupItems,
    });
  }

  return (
    <HeaderOffset full>
      <ContentLayout
        id={appConfig.name}
        sidebar={
          <DetailSidebarClient
            groups={groups}
            section="artifacts"
            locale={locale}
          />
        }
        header={null}
        content={children}
      />
    </HeaderOffset>
  );
}
