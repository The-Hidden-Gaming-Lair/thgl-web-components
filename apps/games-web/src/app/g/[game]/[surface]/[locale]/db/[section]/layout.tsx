import { DEFAULT_LOCALE } from "@repo/lib";
import { DbSectionLayout } from "@/lib/db/db-section-layout";
import { getAppConfig } from "@/lib/get-app-config";

/**
 * Generic, tenant-resolved section layout. Wraps every dynamic `/db/<section>`
 * (list + detail) in the shared sidebar layout — the same grouped, searchable
 * sidebar HoMM/Drakantos use, but driven by the tenant's `db.homeSections`
 * instead of a per-game factory. Static per-game section folders still take
 * precedence over this dynamic segment.
 */
type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale?: string; section: string }>;
};

export default async function Layout({ children, params }: LayoutProps) {
  const { locale = DEFAULT_LOCALE, section } = await params;
  const appConfig = await getAppConfig();
  const secCfg = appConfig.db?.homeSections.find(
    (s) => s.href === `/db/${section}` || s.type === section,
  );
  if (!appConfig.db || !secCfg) return <>{children}</>;

  const types = [secCfg.type, ...(secCfg.extraTypes ?? [])];
  return (
    <DbSectionLayout
      appConfig={appConfig}
      section={section}
      types={types}
      groupLabelPrefix=""
      locale={locale}
      lazySidebar
    >
      {children}
    </DbSectionLayout>
  );
}
