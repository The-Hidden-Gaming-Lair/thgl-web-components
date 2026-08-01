import { type Metadata } from "next";
import { DEFAULT_LOCALE } from "@repo/lib";
import { JSONLDScript } from "@repo/ui/apps";
import { collectionPageJsonLd } from "@/lib/db/json-ld";
import { getAppConfig } from "@/lib/get-app-config";
import { loadQuests } from "@/games/duet-night-abyss/quests";
import { QuestList } from "@/games/duet-night-abyss/quest-list";
import { questsIndexMetadata } from "@/games/duet-night-abyss/metadata";
import { duetNightAbyss } from "@/configs/duet-night-abyss";
import GenericSectionPage, {
  generateMetadata as genericSectionMetadata,
} from "../[section]/page";

// "quests" is a RESERVED slug owned by Duet Night Abyss's bespoke quest compendium — this static
// route shadows the generic `[section]` segment. For any OTHER tenant that declares a `quests` db
// section (e.g. DragonSword), DELEGATE to the generic section page so its config-driven codex
// renders instead of 404ing (see the db reserved-route-slugs gotcha: delegate, don't rename).
const DNA = "duet-night-abyss";
type PageProps = { params: Promise<{ locale?: string }> };

const withSection = async (params: PageProps["params"]) => ({
  ...(await params),
  section: "quests",
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const app = await getAppConfig();
  if (app.name !== DNA) {
    return genericSectionMetadata({
      params: Promise.resolve(await withSection(params)),
    });
  }
  const { locale = DEFAULT_LOCALE } = await params;
  return questsIndexMetadata(locale);
}

export default async function Page({ params }: PageProps) {
  const app = await getAppConfig();
  if (app.name !== DNA) {
    return GenericSectionPage({
      params: Promise.resolve(await withSection(params)),
    });
  }

  const { locale = DEFAULT_LOCALE } = await params;
  const { groups, chains } = await loadQuests();
  const totalCount = groups.reduce((s, g) => s + g.quests.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <JSONLDScript
        json={collectionPageJsonLd({
          appConfig: duetNightAbyss,
          section: "/db/quests",
          sectionLabel: "Quests",
          description: "Quest compendium for Duet Night Abyss.",
          items: groups.flatMap((g) =>
            g.quests.map((q) => ({ id: q.id, name: q.props.name })),
          ),
          locale,
        })}
      />
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Quests</h1>
        <p className="text-sm text-muted-foreground">
          {totalCount} quests across main, character, story, and world arcs.
          Follow quest chains, see prerequisites, and check rewards.
        </p>
      </header>
      <QuestList groups={groups} chains={chains} locale={locale} />
    </div>
  );
}
