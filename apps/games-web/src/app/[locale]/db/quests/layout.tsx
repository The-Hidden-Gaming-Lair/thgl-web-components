import { DEFAULT_LOCALE } from "@repo/lib";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { DetailSidebarClient } from "@/lib/db/detail-sidebar-client";
import { getAppConfig } from "@/lib/get-app-config";
import { loadQuests } from "@/games/duet-night-abyss/quests";
import GenericSectionLayout from "../[section]/layout";

// Reserved-slug delegation (see page.tsx): non-DNA tenants get the generic section layout.
const DNA = "duet-night-abyss";

export default async function QuestsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const app = await getAppConfig();
  if (app.name !== DNA) {
    return GenericSectionLayout({
      children,
      params: Promise.resolve({ ...(await params), section: "quests" }),
    });
  }

  const { locale = DEFAULT_LOCALE } = await params;
  const { groups } = await loadQuests();

  const sidebarGroups = groups
    .filter((g) => g.quests.length > 0)
    .map((g) => ({
      label: g.label,
      items: g.quests.map((q) => ({ id: q.id, name: q.props.name })),
    }));

  return (
    <HeaderOffset full>
      <ContentLayout
        id="duet-night-abyss"
        sidebar={
          <DetailSidebarClient
            groups={sidebarGroups}
            section="/db/quests"
            locale={locale}
          />
        }
        header={null}
        content={children}
      />
    </HeaderOffset>
  );
}
