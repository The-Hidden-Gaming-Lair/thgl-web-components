import { DEFAULT_LOCALE } from "@repo/lib";
import { DbSectionLayout } from "@/lib/db/db-section-layout";
import { getAppConfig, requireApp } from "@/lib/get-app-config";
import GenericSectionLayout from "../[section]/layout";

// "spells" is a RESERVED slug owned by HoMM: Olden Era's bespoke spell grid. Any other tenant
// with a `spells` db section (Baldur's Gate EE) delegates to the generic section layout
// (reserved-route-slugs gotcha: delegate, don't rename).
const HOMM = "homm-olden-era";

export default async function SpellsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const app = await getAppConfig();
  if (app.name !== HOMM) {
    return GenericSectionLayout({
      children,
      params: Promise.resolve({ ...(await params), section: "spells" }),
    });
  }
  const appConfig = await requireApp(HOMM);
  const { locale = DEFAULT_LOCALE } = await params;
  return (
    <DbSectionLayout
      appConfig={appConfig}
      section="spells"
      types={["spells"]}
      groupLabelPrefix="ui.school_"
      locale={locale}
    >
      {children}
    </DbSectionLayout>
  );
}
