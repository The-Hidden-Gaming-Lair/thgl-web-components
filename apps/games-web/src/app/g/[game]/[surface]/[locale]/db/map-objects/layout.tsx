import { DEFAULT_LOCALE } from "@repo/lib";
import { DbSectionLayout } from "@/lib/db/db-section-layout";
import { requireApp } from "@/lib/get-app-config";

export default async function MapObjectsLayout({
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
      section="map-objects"
      types={["map_objects"]}
      groupLabelPrefix=""
      locale={locale}
    >
      {children}
    </DbSectionLayout>
  );
}
