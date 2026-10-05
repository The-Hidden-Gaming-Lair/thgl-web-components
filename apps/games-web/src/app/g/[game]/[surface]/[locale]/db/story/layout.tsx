// Multi-tenant /db/story layout. BPSR wraps story pages in its bespoke
// section layout; Drakantos uses the shared DbSectionLayout (sidebar grouped
// by story_chapters / story_guides).

import { DEFAULT_LOCALE } from "@repo/lib";
import { notFound } from "next/navigation";
import { getAppConfig, requireApp } from "@/lib/get-app-config";
import { DbSectionLayout } from "@/lib/db/db-section-layout";
import { BpsrSectionLayout } from "@/games/blue-protocol-star-resonance/section-layout";

export default async function StoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const config = await getAppConfig();
  const { locale = DEFAULT_LOCALE } = await params;
  if (config.name === "blue-protocol-star-resonance") {
    return (
      <BpsrSectionLayout segment="story" locale={locale}>
        {children}
      </BpsrSectionLayout>
    );
  }
  if (config.name === "drakantos") {
    const appConfig = await requireApp("drakantos");
    return (
      <DbSectionLayout
        appConfig={appConfig}
        section="story"
        types={["story", "guide"]}
        groupLabelPrefix=""
        locale={locale}
      >
        {children}
      </DbSectionLayout>
    );
  }
  notFound();
}
