import { type Metadata } from "next";
import {
  fetchDatabaseIndex,
  fetchDatabaseType,
  fetchDict,
  DEFAULT_LOCALE,
} from "@repo/lib";
import { generateCategoryMetadata } from "@/games/homm-olden-era/metadata";
import { getAppConfig, requireApp } from "@/lib/get-app-config";
import { resolveDict } from "@/lib/db/resolve-dict";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { SectionJsonLd } from "@/lib/db/section-jsonld";
import { SkillTreeList } from "@/games/homm-olden-era/skill-tree";
import { buildSkillNodes } from "@/games/homm-olden-era/skill-tree-data";
import GenericSectionPage, {
  generateMetadata as genericSectionMetadata,
} from "@/app/[locale]/db/[section]/page";

type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  // Only HoMM has the bespoke skill-tree view; other tenants with a `skills`
  // section (e.g. Soul's Remnant) delegate this shadowed slug to the generic list.
  const app = await getAppConfig();
  if (app.name !== "homm-olden-era") {
    const p = await params;
    return genericSectionMetadata({
      params: Promise.resolve({ ...p, section: "skills" }),
    });
  }
  const { locale = DEFAULT_LOCALE } = await params;
  return generateCategoryMetadata(locale, "skills");
}

export default async function Page({ params }: PageProps) {
  const app = await getAppConfig();
  if (app.name !== "homm-olden-era") {
    const p = await params;
    return GenericSectionPage({
      params: Promise.resolve({ ...p, section: "skills" }),
    });
  }
  const appConfig = await requireApp("homm-olden-era");
  const { locale = DEFAULT_LOCALE } = await params;
  const [dict, skillsCat, indexDb] = await Promise.all([
    fetchDict(appConfig.name, locale),
    fetchDatabaseType(appConfig.name, "skills"),
    fetchDatabaseIndex(appConfig.name),
  ]);
  const sectionLabel = resolveDict(dict, "skills");
  const skillNodes = await buildSkillNodes(
    [skillsCat, ...indexDb.filter((c) => c.type === "sub_skills")],
    dict,
  );

  return (
    <>
      <SectionJsonLd
        appConfig={appConfig}
        section="skills"
        sectionLabel={sectionLabel}
        description={`Browse all ${sectionLabel.toLowerCase()} in ${appConfig.title}.`}
        dict={dict}
        database={[
          skillsCat,
          ...indexDb.filter((c) => c.type === "sub_skills"),
        ]}
        types={["skills", "sub_skills"]}
        locale={locale}
      />
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Breadcrumb
          crumbs={[{ label: sectionLabel }]}
          locale={locale}
          dict={dict}
        />
        <h1 className="text-2xl font-bold mb-6">{sectionLabel}</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <SkillTreeList skills={skillNodes} locale={locale} />
      </div>
    </>
  );
}
