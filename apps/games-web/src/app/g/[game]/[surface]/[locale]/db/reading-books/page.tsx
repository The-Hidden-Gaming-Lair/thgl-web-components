import { type Metadata } from "next";
import { DEFAULT_LOCALE } from "@repo/lib";
import { JSONLDScript } from "@repo/ui/apps";
import { requireApp } from "@/lib/get-app-config";
import { SectionJsonLd } from "@/lib/db/section-jsonld";
import { collectionPageJsonLd } from "@/lib/db/json-ld";
import {
  groupsAsDatabase,
  loadSection,
} from "@/games/blue-protocol-star-resonance/data";
import { BPSR_SECTIONS } from "@/games/blue-protocol-star-resonance/sections";
import { SectionHero } from "@/games/blue-protocol-star-resonance/section-hero";
import { SectionList } from "@/games/blue-protocol-star-resonance/section-list";
import { sectionMetadata } from "@/games/blue-protocol-star-resonance/metadata";
import { blueProtocolStarResonance } from "@/configs/blue-protocol-star-resonance";

type PageProps = { params: Promise<{ locale?: string }> };

const SECTION = BPSR_SECTIONS["reading-books"];

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  await requireApp("blue-protocol-star-resonance");
  const { locale = DEFAULT_LOCALE } = await params;
  return sectionMetadata(SECTION, locale);
}

export default async function Page({ params }: PageProps) {
  await requireApp("blue-protocol-star-resonance");
  const { locale = DEFAULT_LOCALE } = await params;
  const groups = await loadSection(SECTION, locale);
  const totalCount = groups.reduce((s, g) => s + g.items.length, 0);
  const database = groupsAsDatabase(SECTION, groups);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      <JSONLDScript
        json={collectionPageJsonLd({
          appConfig: blueProtocolStarResonance,
          section: SECTION.href,
          sectionLabel: SECTION.label,
          description: SECTION.tagline,
          items: groups.flatMap((g) =>
            g.items.map((i) => ({ id: i.id, name: i.props.title })),
          ),
          locale,
        })}
      />
      <SectionJsonLd
        appConfig={blueProtocolStarResonance}
        section={SECTION.href}
        sectionLabel={SECTION.label}
        description={SECTION.tagline}
        dict={{}}
        database={database}
        typePrefixes={[SECTION.typePrefix]}
        resolveName={(item) =>
          (item.props as { title?: string }).title ?? item.id
        }
        locale={locale}
      />
      <SectionHero
        section={SECTION}
        totalCount={totalCount}
        totalCategories={groups.length}
      />
      <SectionList section={SECTION} groups={groups} locale={locale} />
    </div>
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
