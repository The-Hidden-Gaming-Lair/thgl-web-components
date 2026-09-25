import { type Metadata } from "next";
import { fetchDbDict, DEFAULT_LOCALE } from "@repo/lib";
import { generateEntryMetadata } from "@/games/homm-olden-era/metadata";
import { requireApp } from "@/lib/get-app-config";
import { resolveDict } from "@/lib/db/resolve-dict";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { DatabaseEntryContent } from "@/games/homm-olden-era/database-entry";

type Params = Promise<{ id: string; locale?: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  await requireApp("homm-olden-era");
  const { id, locale = DEFAULT_LOCALE } = await params;
  return generateEntryMetadata(locale, "factions", id);
}

export default async function EntryPage({ params }: { params: Params }) {
  const appConfig = await requireApp("homm-olden-era");
  const { id, locale = DEFAULT_LOCALE } = await params;
  const dict = await fetchDbDict(appConfig.name, locale);

  const factionLabel = resolveDict(dict, `faction_${id}`);
  const directLabel = resolveDict(dict, id);
  const entryLabel =
    factionLabel !== `faction_${id}` ? factionLabel : directLabel;

  return (
    <>
      <Breadcrumb
        crumbs={[
          { label: resolveDict(dict, "factions"), href: "/db/factions" },
          { label: entryLabel },
        ]}
        locale={locale}
        dict={dict}
      />
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <DatabaseEntryContent id={id} typePrefix="factions" locale={locale} />
      </div>
    </>
  );
}
