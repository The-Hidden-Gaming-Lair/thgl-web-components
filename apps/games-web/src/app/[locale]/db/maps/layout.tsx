import { DEFAULT_LOCALE } from "@repo/lib";
import { DbSectionLayout } from "@/lib/db/db-section-layout";
import { getAppConfig, requireApp } from "@/lib/get-app-config";

export default async function MapsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const { locale = DEFAULT_LOCALE } = await params;
  const app = await getAppConfig();
  // Non-HoMM tenants (e.g. Soul's Remnant) reuse the SAME generic sidebar the
  // dynamic [section]/layout renders, resolving the section from their own config.
  if (app.name !== "homm-olden-era") {
    const secCfg = app.db?.homeSections.find(
      (s) => s.href === "/db/maps" || s.type === "maps",
    );
    if (!app.db || !secCfg) return <>{children}</>;
    return (
      <DbSectionLayout
        appConfig={app}
        section="maps"
        types={[secCfg.type, ...(secCfg.extraTypes ?? [])]}
        groupLabelPrefix=""
        locale={locale}
      >
        {children}
      </DbSectionLayout>
    );
  }
  const appConfig = await requireApp("homm-olden-era");
  return (
    <DbSectionLayout
      appConfig={appConfig}
      section="maps"
      types={["maps"]}
      groupLabelPrefix="ui.map_mode_"
      locale={locale}
    >
      {children}
    </DbSectionLayout>
  );
}
