import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE } from "@repo/lib";
import { JSONLDScript } from "@repo/ui/apps";
import { excerpt, findEntry } from "@/lib/db/wiki";
import { entityPageJsonLd } from "@/lib/db/json-ld";
import { requireApp } from "@/lib/get-app-config";
import { localizedSection } from "@/games/once-human/sections";
import { OnceHumanEntryDetail } from "@/games/once-human/entry-detail";
import { entryMetadata } from "@/games/once-human/metadata";
import { onceHuman } from "@/configs/once-human";

type Params = Promise<{ id: string; locale?: string }>;

const SECTION_KEY = "remnants" as const;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  await requireApp("once-human");
  const { id, locale = DEFAULT_LOCALE } = await params;
  const SECTION = await localizedSection(SECTION_KEY, locale);
  const found = await findEntry("once-human", SECTION, id, locale);
  if (!found) return {};
  const summary = excerpt(found.item.props.content ?? "", 160);
  return entryMetadata(SECTION, id, found.item.props.title, summary, locale);
}

export default async function Page({ params }: { params: Params }) {
  await requireApp("once-human");
  const { id, locale = DEFAULT_LOCALE } = await params;
  const SECTION = await localizedSection(SECTION_KEY, locale);
  const found = await findEntry("once-human", SECTION, id, locale);
  if (!found) notFound();

  const summary = excerpt(found.item.props.content ?? "", 200);

  return (
    <>
      <JSONLDScript
        json={entityPageJsonLd({
          appConfig: onceHuman,
          section: SECTION.href,
          sectionLabel: SECTION.label,
          entityId: id,
          entityName: found.item.props.title,
          description: summary,
          locale,
        })}
      />
      <OnceHumanEntryDetail
        section={SECTION}
        item={found.item}
        neighbors={found.neighbors}
        siblings={found.siblings}
        locale={locale}
      />
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
