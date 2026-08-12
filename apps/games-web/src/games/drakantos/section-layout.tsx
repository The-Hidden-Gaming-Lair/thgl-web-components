// Factory: returns a /db/<section>/layout.tsx component that renders the
// shared `DbSectionLayout` (sidebar + content). Each section folder's
// layout.tsx is a 3-line wrapper around this.

import { DEFAULT_LOCALE } from "@repo/lib";
import { DbSectionLayout } from "@/lib/db/db-section-layout";
import { getAppConfig, requireApp } from "@/lib/get-app-config";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
};

/**
 * @param section URL slug AND the matching database `type` value (e.g. "items").
 * @param types Additional types whose items appear in this section's sidebar.
 *              Defaults to `[section]`.
 * @param groupLabelPrefix Optional prefix used to resolve groupId → dict label.
 *                         e.g. "" or undefined → look up the raw groupId.
 */
export function makeSectionLayout(
  section: string,
  types: string[] = [section],
  groupLabelPrefix: string = "",
) {
  return async function Layout({ children, params }: LayoutProps) {
    // Non-Drakantos tenants: these static /db/<slug> routes delegate their PAGE
    // to the generic [section] page (see category-page/entry-page), which brings
    // its own chrome — the Drakantos sidebar layout must not gate or wrap it.
    const app = await getAppConfig();
    if (app.name !== "drakantos") return <>{children}</>;
    const appConfig = await requireApp("drakantos");
    const { locale = DEFAULT_LOCALE } = await params;
    return (
      <DbSectionLayout
        appConfig={appConfig}
        section={section}
        types={types}
        groupLabelPrefix={groupLabelPrefix}
        locale={locale}
      >
        {children}
      </DbSectionLayout>
    );
  };
}
