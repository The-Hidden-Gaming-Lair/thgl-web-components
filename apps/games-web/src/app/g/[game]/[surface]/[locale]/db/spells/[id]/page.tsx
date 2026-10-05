import { type Metadata } from "next";
import { fetchDbDict, DEFAULT_LOCALE } from "@repo/lib";
import {
  generateEntryMetadata,
  generateGroupMetadata,
} from "@/games/homm-olden-era/metadata";
import { getAppConfig, requireApp } from "@/lib/get-app-config";
import { resolveDict } from "@/lib/db/resolve-dict";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { DatabaseEntryContent } from "@/games/homm-olden-era/database-entry";
import {
  getGroupData,
  GroupPageContent,
} from "@/games/homm-olden-era/group-page";
import GenericEntityPage, {
  generateMetadata as genericEntityMetadata,
} from "../../[section]/[id]/page";

type Params = Promise<{ id: string; locale?: string }>;

// Reserved-slug delegation (see ../layout.tsx): non-HoMM tenants get the generic entity page.
const HOMM = "homm-olden-era";
const TYPES = ["spells"];
const GROUP_PREFIX = "ui.school_";
const SECTION = "spells";

const withSection = async (params: Params) => ({
  ...(await params),
  section: SECTION,
});

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const app = await getAppConfig();
  if (app.name !== HOMM) {
    return genericEntityMetadata({
      params: Promise.resolve(await withSection(params)),
    });
  }
  const { id, locale = DEFAULT_LOCALE } = await params;
  const groupData = await getGroupData(TYPES, id);
  if (groupData)
    return generateGroupMetadata(locale, SECTION, id, GROUP_PREFIX, SECTION);
  return generateEntryMetadata(locale, SECTION, id);
}

export default async function EntryPage({ params }: { params: Params }) {
  const app = await getAppConfig();
  if (app.name !== HOMM) {
    return GenericEntityPage({
      params: Promise.resolve(await withSection(params)),
    });
  }
  const appConfig = await requireApp(HOMM);
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

// Cached in Next's page cache (cache-handler.cjs): rendered once per pod and
// game data version, then served without re-rendering — see
// src/lib/route-params.ts. No dynamic APIs below this route; plain fetches stay
// uncached so a re-render after a data update always sees fresh data.
export const dynamic = "force-static";
export const fetchCache = "default-no-store";
export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}
