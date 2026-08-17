import {
  DEFAULT_LOCALE,
  fetchDatabaseIndex,
  fetchDatabaseType,
  fetchDict,
} from "@repo/lib";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { DbSectionLayout } from "@/lib/db/db-section-layout";
import { getAppConfig, requireApp } from "@/lib/get-app-config";
import { SkillTreeSidebar } from "@/games/homm-olden-era/skill-tree";
import { buildSkillNodes } from "@/games/homm-olden-era/skill-tree-data";

export default async function SkillsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const { locale = DEFAULT_LOCALE } = await params;
  const app = await getAppConfig();
  // Non-HoMM tenants (e.g. Soul's Remnant) reuse the generic [section] sidebar
  // instead of the bespoke skill tree.
  if (app.name !== "homm-olden-era") {
    const secCfg = app.db?.homeSections.find(
      (s) => s.href === "/db/skills" || s.type === "skills",
    );
    if (!app.db || !secCfg) return <>{children}</>;
    return (
      <DbSectionLayout
        appConfig={app}
        section="skills"
        types={[secCfg.type, ...(secCfg.extraTypes ?? [])]}
        groupLabelPrefix=""
        locale={locale}
      >
        {children}
      </DbSectionLayout>
    );
  }
  const appConfig = await requireApp("homm-olden-era");
  const [dict, skillsCat, indexDb] = await Promise.all([
    fetchDict(appConfig.name, locale),
    fetchDatabaseType(appConfig.name, "skills"),
    fetchDatabaseIndex(appConfig.name),
  ]);
  const skillNodes = await buildSkillNodes(
    [skillsCat, ...indexDb.filter((c) => c.type === "sub_skills")],
    dict,
  );

  return (
    <HeaderOffset full>
      <ContentLayout
        id={appConfig.name}
        sidebar={<SkillTreeSidebar skills={skillNodes} locale={locale} />}
        header={null}
        content={children}
      />
    </HeaderOffset>
  );
}
