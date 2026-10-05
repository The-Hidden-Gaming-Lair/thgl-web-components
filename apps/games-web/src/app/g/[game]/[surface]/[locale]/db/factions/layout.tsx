import { DEFAULT_LOCALE } from "@repo/lib";
import { DbSectionLayout } from "@/lib/db/db-section-layout";
import { requireApp } from "@/lib/get-app-config";

export default async function FactionsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const appConfig = await requireApp("homm-olden-era");
  const { locale = DEFAULT_LOCALE } = await params;
  return (
    <DbSectionLayout
      appConfig={appConfig}
      section="factions"
      types={["factions", "specializations", "faction_laws"]}
      groupLabelPrefix=""
      nameLabelPrefixByType={{ factions: "faction_" }}
      locale={locale}
    >
      {children}
    </DbSectionLayout>
  );
}
