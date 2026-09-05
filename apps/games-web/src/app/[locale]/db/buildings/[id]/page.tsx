import { type Metadata } from "next";
import { fetchDict, DEFAULT_LOCALE } from "@repo/lib";
import {
  generateEntryMetadata,
  generateGroupMetadata,
} from "@/games/homm-olden-era/metadata";
import { getAppConfig } from "@/lib/get-app-config";
import { resolveDict } from "@/lib/db/resolve-dict";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { DatabaseEntryContent } from "@/games/homm-olden-era/database-entry";
import {
  getGroupData,
  GroupPageContent,
} from "@/games/homm-olden-era/group-page";
import GenericEntryPage, {
  generateMetadata as genericEntryMetadata,
} from "../../[section]/[id]/page";

type Params = Promise<{ id: string; locale?: string }>;

const TYPES = ["buildings"];
const GROUP_PREFIX = "faction_";
const SECTION = "buildings";

// Non-HoMM tenants delegate to the generic [section]/[id] detail page — see the
// note in ../page.tsx (`buildings` is a plain db-section slug for other games).
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const app = await getAppConfig();
  if (app.name !== "homm-olden-era") {
    const p = await params;
    return genericEntryMetadata({
      params: Promise.resolve({ ...p, section: SECTION }),
    });
  }
  const { id, locale = DEFAULT_LOCALE } = await params;
  const groupData = await getGroupData(TYPES, id);
  if (groupData)
    return generateGroupMetadata(locale, SECTION, id, GROUP_PREFIX, SECTION);
  return generateEntryMetadata(locale, SECTION, id);
}

export default async function EntryPage({ params }: { params: Params }) {
  const appConfig = await getAppConfig();
  if (appConfig.name !== "homm-olden-era") {
    const p = await params;
    return GenericEntryPage({
      params: Promise.resolve({ ...p, section: SECTION }),
    });
  }
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

  const dict = await fetchDict(appConfig.name, locale);

  return (
    <>
      <Breadcrumb
        crumbs={[
          { label: resolveDict(dict, "buildings"), href: "/db/buildings" },
          { label: resolveDict(dict, id) },
        ]}
        locale={locale}
        dict={dict}
      />
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <DatabaseEntryContent id={id} typePrefix="buildings" locale={locale} />
      </div>
    </>
  );
}
