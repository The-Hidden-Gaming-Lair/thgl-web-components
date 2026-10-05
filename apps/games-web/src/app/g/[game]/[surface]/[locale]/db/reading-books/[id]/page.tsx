import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE } from "@repo/lib";
import { JSONLDScript } from "@repo/ui/apps";
import { requireApp } from "@/lib/get-app-config";
import { entityPageJsonLd } from "@/lib/db/json-ld";
import { findEntry } from "@/games/blue-protocol-star-resonance/data";
import { BPSR_SECTIONS } from "@/games/blue-protocol-star-resonance/sections";
import { EntryDetail } from "@/games/blue-protocol-star-resonance/entry-detail";
import { entryMetadata } from "@/games/blue-protocol-star-resonance/metadata";
import { excerpt } from "@/lib/db/wiki";
import { blueProtocolStarResonance } from "@/configs/blue-protocol-star-resonance";

type Params = Promise<{ id: string; locale?: string }>;

const SECTION = BPSR_SECTIONS["reading-books"];

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  await requireApp("blue-protocol-star-resonance");
  const { id, locale = DEFAULT_LOCALE } = await params;
  const found = await findEntry(SECTION, id, locale);
  if (!found) return {};
  // Books carry both `description` (short blurb) and `content` (full text).
  // Prefer the description for the meta description; fall back to a
  // content excerpt when missing.
  const summary = found.item.props.description
    ? excerpt(found.item.props.description, 160)
    : excerpt(found.item.props.content ?? "", 160);
  return entryMetadata(SECTION, id, found.item.props.title, summary, locale);
}

export default async function Page({ params }: { params: Params }) {
  await requireApp("blue-protocol-star-resonance");
  const { id, locale = DEFAULT_LOCALE } = await params;
  const found = await findEntry(SECTION, id, locale);
  if (!found) notFound();

  const summary = found.item.props.description
    ? excerpt(found.item.props.description, 200)
    : excerpt(found.item.props.content ?? "", 200);

  return (
    <>
      <JSONLDScript
        json={entityPageJsonLd({
          appConfig: blueProtocolStarResonance,
          section: SECTION.href,
          sectionLabel: SECTION.label,
          entityId: id,
          entityName: found.item.props.title,
          description: summary,
          locale,
        })}
      />
      <EntryDetail
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
