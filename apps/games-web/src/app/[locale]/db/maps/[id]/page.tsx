import { type Metadata } from "next";
import { fetchDict, DEFAULT_LOCALE } from "@repo/lib";
import { generateEntryMetadata } from "@/games/homm-olden-era/metadata";
import { getAppConfig, requireApp } from "@/lib/get-app-config";
import { resolveDict } from "@/lib/db/resolve-dict";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { DatabaseEntryContent } from "@/games/homm-olden-era/database-entry";
import GenericEntryPage, {
  generateMetadata as genericEntryMetadata,
} from "@/app/[locale]/db/[section]/[id]/page";

type Params = Promise<{ id: string; locale?: string }>;

const SECTION = "maps";

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  // Only HoMM has a bespoke map view; every other tenant with a `maps` DB section
  // (e.g. Soul's Remnant) delegates to the generic [section]/[id] page this static
  // slug shadows (see reference_db_reserved_route_slugs).
  const app = await getAppConfig();
  if (app.name !== "homm-olden-era") {
    const p = await params;
    return genericEntryMetadata({
      params: Promise.resolve({ ...p, section: SECTION }),
    });
  }
  const { id, locale = DEFAULT_LOCALE } = await params;
  return generateEntryMetadata(locale, SECTION, id);
}

export default async function EntryPage({ params }: { params: Params }) {
  const app = await getAppConfig();
  if (app.name !== "homm-olden-era") {
    const p = await params;
    return GenericEntryPage({
      params: Promise.resolve({ ...p, section: SECTION }),
    });
  }
  const appConfig = await requireApp("homm-olden-era");
  const { id, locale = DEFAULT_LOCALE } = await params;

  const dict = await fetchDict(appConfig.name, locale);
  const sectionLabel = resolveDict(dict, "maps");
  const entryLabel = resolveDict(dict, id);

  return (
    <>
      <Breadcrumb
        crumbs={[
          { label: sectionLabel, href: "/db/maps" },
          { label: entryLabel },
        ]}
        locale={locale}
        dict={dict}
      />
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <DatabaseEntryContent id={id} typePrefix="maps" locale={locale} />
      </div>
    </>
  );
}
