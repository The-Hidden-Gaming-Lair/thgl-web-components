import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE } from "@repo/lib";
import { JSONLDScript } from "@repo/ui/apps";
import { entityPageJsonLd } from "@/lib/db/json-ld";
import { getAppConfig } from "@/lib/get-app-config";
import { findQuest } from "@/games/duet-night-abyss/quests";
import { QuestDetail } from "@/games/duet-night-abyss/quest-detail";
import { questDetailMetadata } from "@/games/duet-night-abyss/metadata";
import { duetNightAbyss } from "@/configs/duet-night-abyss";
import GenericEntityPage, {
  generateMetadata as genericEntityMetadata,
} from "../../[section]/[id]/page";

// Reserved-slug delegation (see ../page.tsx): non-DNA tenants get the generic entity detail page.
const DNA = "duet-night-abyss";
type Params = Promise<{ id: string; locale?: string }>;

const withSection = async (params: Params) => ({
  ...(await params),
  section: "quests",
});

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const app = await getAppConfig();
  if (app.name !== DNA) {
    return genericEntityMetadata({
      params: Promise.resolve(await withSection(params)),
    });
  }
  const { id, locale = DEFAULT_LOCALE } = await params;
  const found = await findQuest(id);
  if (!found) return {};
  return questDetailMetadata(id, found.quest.props.name, locale);
}

export default async function Page({ params }: { params: Params }) {
  const app = await getAppConfig();
  if (app.name !== DNA) {
    return GenericEntityPage({
      params: Promise.resolve(await withSection(params)),
    });
  }

  const { id, locale = DEFAULT_LOCALE } = await params;
  const found = await findQuest(id);
  if (!found) notFound();

  return (
    <>
      <JSONLDScript
        json={entityPageJsonLd({
          appConfig: duetNightAbyss,
          section: "/db/quests",
          sectionLabel: "Quests",
          entityId: id,
          entityName: found.quest.props.name,
          description: `Walkthrough and rewards for ${found.quest.props.name}.`,
          locale,
        })}
      />
      <QuestDetail
        quest={found.quest}
        chain={found.chain}
        byId={found.byId}
        locale={locale}
      />
    </>
  );
}
