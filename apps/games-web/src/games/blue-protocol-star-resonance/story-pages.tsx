// Extracted BPSR story list + entry page implementations so they can be
// invoked from a multi-tenant `/db/story` route that's shared with other
// apps (currently Drakantos). The BPSR-specific JSON-LD, hero, list, and
// entry-detail components are unchanged — only the calling shape moves
// out of `app/g/[game]/[surface]/[locale]/db/story/...` and into this module.

import { type Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { DEFAULT_LOCALE, localizePath } from "@repo/lib";
import { JSONLDScript } from "@repo/ui/apps";
import { SectionJsonLd } from "@/lib/db/section-jsonld";
import { collectionPageJsonLd, entityPageJsonLd } from "@/lib/db/json-ld";
import {
  findEntry,
  groupsAsDatabase,
  legacyEntryId,
  loadSection,
} from "./data";
import { BPSR_SECTIONS } from "./sections";
import { SectionHero } from "./section-hero";
import { SectionList } from "./section-list";
import { EntryDetail } from "./entry-detail";
import { sectionMetadata, entryMetadata } from "./metadata";
import { excerpt } from "@/lib/db/wiki";
import { blueProtocolStarResonance } from "@/configs/blue-protocol-star-resonance";

const SECTION = BPSR_SECTIONS.story;

export async function bpsrStoryMetadata(locale: string): Promise<Metadata> {
  return sectionMetadata(SECTION, locale);
}

export async function BpsrStoryListPage({
  locale = DEFAULT_LOCALE,
}: {
  locale?: string;
}) {
  const rawGroups = await loadSection(SECTION, locale);
  const groups = rawGroups.map((g) => ({
    ...g,
    items: [...g.items].sort((a, b) => {
      const ao =
        typeof a.props.phaseOrder === "number" ? a.props.phaseOrder : 0;
      const bo =
        typeof b.props.phaseOrder === "number" ? b.props.phaseOrder : 0;
      return ao - bo;
    }),
  }));
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

export async function bpsrStoryEntryMetadata(
  id: string,
  locale: string,
): Promise<Metadata> {
  const found = await findEntry(SECTION, id, locale);
  if (!found) return {};
  const summary = excerpt(found.item.props.content ?? "", 160);
  return entryMetadata(SECTION, id, found.item.props.title, summary, locale);
}

export async function BpsrStoryEntryPage({
  id,
  locale = DEFAULT_LOCALE,
}: {
  id: string;
  locale?: string;
}) {
  const found = await findEntry(SECTION, id, locale);
  if (!found) {
    const current = await legacyEntryId(SECTION, id);
    if (current)
      permanentRedirect(localizePath(`${SECTION.href}/${current}`, locale));
    notFound();
  }
  const summary = excerpt(found.item.props.content ?? "", 200);
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
