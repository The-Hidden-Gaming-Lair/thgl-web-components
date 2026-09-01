import { DEFAULT_LOCALE } from "@repo/lib";
import { DbSectionLayout } from "@/lib/db/db-section-layout";
import { getAppConfig } from "@/lib/get-app-config";

// Owned by HoMM: Olden Era (faction-grouped build trees). For every other
// tenant `buildings` is a plain db section — this static folder shadows the
// dynamic [section] segment, so replicate its generic sidebar layout here
// (driven by the tenant's db.homeSections) instead of 404ing non-owners.
export default async function BuildingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const appConfig = await getAppConfig();
  const { locale = DEFAULT_LOCALE } = await params;
  if (appConfig.name !== "homm-olden-era") {
    const secCfg = appConfig.db?.homeSections.find(
      (s) => s.href === "/db/buildings" || s.type === "buildings",
    );
    if (!appConfig.db || !secCfg) return <>{children}</>;
    const types = [secCfg.type, ...(secCfg.extraTypes ?? [])];
    return (
      <DbSectionLayout
        appConfig={appConfig}
        section="buildings"
        types={types}
        groupLabelPrefix=""
        locale={locale}
      >
        {children}
      </DbSectionLayout>
    );
  }
  return (
    <DbSectionLayout
      appConfig={appConfig}
      section="buildings"
      types={["buildings"]}
      groupLabelPrefix="faction_"
      locale={locale}
    >
      {children}
    </DbSectionLayout>
  );
}
