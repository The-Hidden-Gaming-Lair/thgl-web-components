import { type Metadata } from "next";
import { fetchDbDict, DEFAULT_LOCALE } from "@repo/lib";
import {
  generateEntryMetadata,
  generateGroupMetadata,
} from "@/games/homm-olden-era/metadata";
import { requireApp } from "@/lib/get-app-config";
import { resolveDict } from "@/lib/db/resolve-dict";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { DatabaseEntryContent } from "@/games/homm-olden-era/database-entry";
import {
  getGroupData,
  GroupPageContent,
} from "@/games/homm-olden-era/group-page";

type Params = Promise<{ id: string; locale?: string }>;

const TYPES = ["spells"];
const GROUP_PREFIX = "ui.school_";
const SECTION = "spells";

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  await requireApp("homm-olden-era");
  const { id, locale = DEFAULT_LOCALE } = await params;
  const groupData = await getGroupData(TYPES, id);
  if (groupData)
    return generateGroupMetadata(locale, SECTION, id, GROUP_PREFIX, SECTION);
  return generateEntryMetadata(locale, SECTION, id);
}

export default async function EntryPage({ params }: { params: Params }) {
  const appConfig = await requireApp("homm-olden-era");
  const { id, locale = DEFAULT_LOCALE } = await params;
  const groupData = await getGroupData(TYPES, id);

  if (groupData) {
    return (
      <GroupPageContent
        groupId={id}
        section={SECTION}
        sectionDictKey={SECTION}
        types={TYPES}
        groupLabelPrefix={GROUP_PREFIX}
        locale={locale}
      />
    );
  }

  const dict = await fetchDbDict(appConfig.name, locale);

  return (
    <>
      <Breadcrumb
        crumbs={[
          { label: resolveDict(dict, "spells"), href: "/db/spells" },
          { label: resolveDict(dict, id) },
        ]}
        locale={locale}
        dict={dict}
      />
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <DatabaseEntryContent id={id} typePrefix="spells" locale={locale} />
      </div>
    </>
  );
}
