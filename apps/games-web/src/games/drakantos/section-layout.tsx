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
    const { locale = DEFAULT_LOCALE } = await params;
    const app = await getAppConfig();
    // Non-Drakantos tenants: these static /db/<slug> routes SHADOW the generic
    // [section] route (Next prefers the static segment), so they must reproduce
    // the same sidebar chrome the generic [section]/layout renders — otherwise
    // the shadowed section (e.g. Soul's Remnant "items") loses its sidebar while
    // its sibling sections (equipment/monsters via [section]) keep it. Resolve
    // the section from the tenant's own db config, exactly like [section]/layout.
    if (app.name !== "drakantos") {
      const secCfg = app.db?.homeSections.find(
        (s) => s.href === `/db/${section}` || s.type === section,
      );
      if (!app.db || !secCfg) return <>{children}</>;
      return (
        <DbSectionLayout
          appConfig={app}
          section={section}
          types={[secCfg.type, ...(secCfg.extraTypes ?? [])]}
          groupLabelPrefix=""
          locale={locale}
        >
          {children}
        </DbSectionLayout>
      );
    }
    const appConfig = await requireApp("drakantos");
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
