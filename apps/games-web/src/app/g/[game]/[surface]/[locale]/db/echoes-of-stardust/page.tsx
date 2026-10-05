import { type Metadata } from "next";
import { DEFAULT_LOCALE, fetchDatabase } from "@repo/lib";
import { JSONLDScript } from "@repo/ui/apps";
import { WikiSectionHero, WikiSectionList, loadSection } from "@/lib/db/wiki";
import { collectionPageJsonLd } from "@/lib/db/json-ld";
import { SectionJsonLd } from "@/lib/db/section-jsonld";
import { requireApp } from "@/lib/get-app-config";
import { ONCE_HUMAN_SECTIONS } from "@/games/once-human/sections";
import { sectionMetadata } from "@/games/once-human/metadata";
import { onceHuman } from "@/configs/once-human";

type PageProps = { params: Promise<{ locale?: string }> };

const SECTION = ONCE_HUMAN_SECTIONS["echoes-of-stardust"];

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  await requireApp("once-human");
  const { locale = DEFAULT_LOCALE } = await params;
  return sectionMetadata(SECTION, locale);
}

export default async function Page({ params }: PageProps) {
  await requireApp("once-human");
  const { locale = DEFAULT_LOCALE } = await params;
  const groups = await loadSection("once-human", SECTION, locale);
  const totalCount = groups.reduce((s, g) => s + g.items.length, 0);
  const database = await fetchDatabase("once-human");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      <JSONLDScript
        json={collectionPageJsonLd({
          appConfig: onceHuman,
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
        appConfig={onceHuman}
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
      <WikiSectionHero
        section={SECTION}
        totalCount={totalCount}
        totalCategories={groups.length}
      />
      <WikiSectionList section={SECTION} groups={groups} locale={locale} />
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
