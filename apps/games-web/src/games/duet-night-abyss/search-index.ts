import { localizePath } from "@repo/lib";
import { loadQuests } from "./quests";

/**
 * Header search index for Duet Night Abyss. Only quests are indexed —
 * the rest of the site is map-driven and uses `/guides/*` taxonomy
 * which has its own search affordances.
 */
export async function buildDnaSearchIndex(locale: string) {
  const { groups } = await loadQuests(locale);
  const entries = groups.flatMap((g) =>
    g.quests.map((q) => ({
      id: q.id,
      name: q.props.name,
      type: q.type,
      section: "quests",
      href: localizePath(`/db/quests/${q.id}`, locale),
      subtitle: q.props.episode ?? q.props.chapterName ?? g.label,
    })),
  );
  return { entries, iconsUrl: "" };
}
