import { fetchDatabaseType, type DatabaseConfig } from "@repo/lib";

const APP_NAME = "duet-night-abyss";

/**
 * Quest categories surfaced by the database. The pipeline emits four
 * separate categories; we present them to the user as a single
 * `/db/quests` section with the umbrella label "Quests".
 */
const QUEST_TYPES = [
  "mainquests",
  "sidequests_character",
  "sidequests_story",
  "sidequests_world",
] as const;

export const QUEST_CATEGORY_LABEL: Record<
  (typeof QUEST_TYPES)[number],
  string
> = {
  mainquests: "Main Quests",
  sidequests_character: "Character Quests",
  sidequests_story: "Story Quests",
  sidequests_world: "World Quests",
};

export const QUEST_CATEGORY_ACCENT: Record<
  (typeof QUEST_TYPES)[number],
  string
> = {
  mainquests: "text-amber-400 border-amber-800/50 bg-amber-900/20",
  sidequests_character: "text-blue-400 border-blue-800/50 bg-blue-900/20",
  sidequests_story: "text-purple-400 border-purple-800/50 bg-purple-900/20",
  sidequests_world: "text-emerald-400 border-emerald-800/50 bg-emerald-900/20",
};

export type QuestProps = {
  name: string;
  questType?: string;
  storyPath?: string;
  chapterName?: string;
  chapterNumber?: string | number;
  episode?: string;
  episodeName?: string;
  autoStart?: boolean;
  showCondition?: string;
  showConditionName?: string;
  unlockCondition?: string;
  unlockConditionName?: string;
  requiresQuest?: string;
  requiresQuestName?: string;
  questNpcName?: string;
  rewards?: string;
};

export type Quest = {
  id: string;
  type: (typeof QUEST_TYPES)[number];
  props: QuestProps;
};

/**
 * Group quests in the same `episode` into a chain by following the
 * `showCondition` / `requiresQuest` dependency edges. Many DNA episodes
 * are split into Part 1/Part 2/etc., so the chain helps users
 * understand prerequisites at a glance.
 *
 * Returns a map of `questId → ordered chain`. Quests not in a chain
 * (or single-quest episodes) are absent from the map.
 */
function buildQuestChains(quests: Quest[]): Map<string, Quest[]> {
  const chainsById = new Map<string, Quest[]>();
  const byEpisode = new Map<string, Quest[]>();
  for (const q of quests) {
    const ep = q.props.episode;
    if (!ep) continue;
    if (!byEpisode.has(ep)) byEpisode.set(ep, []);
    byEpisode.get(ep)!.push(q);
  }
  for (const episodeQuests of byEpisode.values()) {
    if (episodeQuests.length < 2) continue;
    // The chain root is the quest whose `showCondition` doesn't point
    // to another quest in this episode (it depends only on outside
    // state, or nothing at all).
    const root = episodeQuests.find(
      (q) =>
        !q.props.showCondition ||
        !episodeQuests.some((other) => other.id === q.props.showCondition),
    );
    if (!root) continue;

    const ordered: Quest[] = [root];
    const seen = new Set([root.id]);
    let current = root;
    // Follow the chain forward by either `showCondition` or
    // `requiresQuest` — both point at "the quest that came before".
    while (true) {
      const next = episodeQuests.find(
        (q) =>
          !seen.has(q.id) &&
          (q.props.showCondition === current.id ||
            q.props.requiresQuest === current.id),
      );
      if (!next) break;
      ordered.push(next);
      seen.add(next.id);
      current = next;
    }
    for (const q of ordered) chainsById.set(q.id, ordered);
  }
  return chainsById;
}

/**
 * Load every quest grouped by category. Each group is a `{ type,
 * label, quests }` triple; the label is the human-readable category
 * name from QUEST_CATEGORY_LABEL.
 */
export async function loadQuests(): Promise<{
  groups: Array<{ type: Quest["type"]; label: string; quests: Quest[] }>;
  chains: Map<string, Quest[]>;
  byId: Map<string, Quest>;
}> {
  // The codex ships split (database.<type>.json, no monolith since inbox #411).
  const categories: DatabaseConfig = await Promise.all(
    QUEST_TYPES.map((t) => fetchDatabaseType(APP_NAME, t)),
  );

  const groups = QUEST_TYPES.map((t, i) => {
    const cat = categories[i];
    const quests: Quest[] = (cat?.items ?? []).map((i) => ({
      id: i.id,
      type: t,
      props: i.props as QuestProps,
    }));
    return { type: t, label: QUEST_CATEGORY_LABEL[t], quests };
  });

  const all = groups.flatMap((g) => g.quests);
  const chains = buildQuestChains(all);
  const byId = new Map(all.map((q) => [q.id, q]));

  return { groups, chains, byId };
}

/** Lookup a single quest plus its chain neighbors. */
export async function findQuest(
  id: string,
): Promise<{ quest: Quest; chain: Quest[]; byId: Map<string, Quest> } | null> {
  const { byId, chains } = await loadQuests();
  const quest = byId.get(id);
  if (!quest) return null;
  return { quest, chain: chains.get(id) ?? [quest], byId };
}
