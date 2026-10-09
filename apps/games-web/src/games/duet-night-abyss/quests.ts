import {
  fetchDatabaseIndex,
  fetchDatabaseType,
  fetchVersion,
  translate,
  type DatabaseConfig,
  type Dict,
} from "@repo/lib";
import { getFullDbDictionary } from "@repo/ui/dicts";
import { localizeProps, resolveDict } from "@/lib/db/resolve-dict";
import labelsEn from "./i18n/en.json";
import labelsFr from "./i18n/fr.json";
import labelsJa from "./i18n/ja.json";
import labelsKo from "./i18n/ko.json";
import labelsZhCN from "./i18n/zh-CN.json";
import labelsZhTW from "./i18n/zh-TW.json";

const APP_NAME = "duet-night-abyss";

/** Page labels per locale (the game's own text comes from the dicts). */
const LABELS: Record<string, Dict> = {
  en: labelsEn,
  fr: labelsFr,
  ja: labelsJa,
  ko: labelsKo,
  "zh-CN": labelsZhCN,
  "zh-TW": labelsZhTW,
};

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

export const QUEST_CATEGORY_ACCENT: Record<
  (typeof QUEST_TYPES)[number],
  string
> = {
  mainquests: "text-amber-400 border-amber-800/50 bg-amber-900/20",
  sidequests_character: "text-blue-400 border-blue-800/50 bg-blue-900/20",
  sidequests_story: "text-purple-400 border-purple-800/50 bg-purple-900/20",
  sidequests_world: "text-emerald-400 border-emerald-800/50 bg-emerald-900/20",
};

/** A cross-link to another codex entry (`/db/<section>/<id>`); its name lives in the dict. */
export type QuestRewardRef = { id: string; section: string; count?: number };

/**
 * Text props arrive in English; the locale's text comes from the dict (`<id>`
 * name, `<id>_desc`, `<id>.<prop>` for chapter/episode/NPC). `loadQuests`
 * swaps them in, so everything below renders the requested locale.
 */
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
  rewardItems?: QuestRewardRef[];
};

export type Quest = {
  id: string;
  type: (typeof QUEST_TYPES)[number];
  props: QuestProps;
  /** Localized description (the in-game quest text), when the game has one. */
  desc?: string;
};

/** Page label (`i18n/<locale>.json`, merged into the dict by `loadQuests`). */
export function questLabel(
  dict: Dict,
  key: string,
  vars?: Record<string, string>,
): string {
  return translate(dict, `quests.${key}`, { vars });
}

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

/** The dict's text for `key`, or undefined when it has none. */
function dictText(dict: Dict, key: string | undefined): string | undefined {
  if (!key || !dict[key]) return undefined;
  return resolveDict(dict, key);
}

/**
 * Load every quest grouped by category, localized to `locale`. Each group
 * is a `{ type, label, quests }` triple. Chains are built from the English
 * episode, so they are identical in every locale.
 */
export async function loadQuests(locale: string): Promise<{
  groups: Array<{ type: Quest["type"]; label: string; quests: Quest[] }>;
  chains: Map<string, Quest[]>;
  byId: Map<string, Quest>;
  dict: Dict;
}> {
  // The codex ships split (database.<type>.json, no monolith since inbox #411).
  const [categories, gameDict] = await Promise.all([
    Promise.all(
      QUEST_TYPES.map((t) => fetchDatabaseType(APP_NAME, t)),
    ) as Promise<DatabaseConfig>,
    getFullDbDictionary(APP_NAME, locale),
  ]);
  const dict: Dict = { ...LABELS.en, ...LABELS[locale], ...gameDict };

  const groups = QUEST_TYPES.map((t, i) => {
    const cat = categories[i];
    const quests: Quest[] = (cat?.items ?? []).map((i) => ({
      id: i.id,
      type: t,
      props: i.props as QuestProps,
    }));
    return { type: t, label: questLabel(dict, `cat.${t}`), quests };
  });

  const all = groups.flatMap((g) => g.quests);
  const chains = buildQuestChains(all);

  // Swap in the locale's text after the chains are built (they key on the
  // English episode).
  for (const q of all) {
    const en = q.props;
    const props = localizeProps({ ...en }, q.id, dict);
    props.name = dictText(dict, q.id) ?? en.name;
    props.showConditionName =
      dictText(dict, en.showCondition) ?? en.showConditionName;
    props.unlockConditionName =
      dictText(dict, en.unlockCondition) ?? en.unlockConditionName;
    props.requiresQuestName =
      dictText(dict, en.requiresQuest) ?? en.requiresQuestName;
    q.props = props;
    q.desc = dictText(dict, `${q.id}_desc`);
  }
  const byId = new Map(all.map((q) => [q.id, q]));

  return { groups, chains, byId, dict };
}

/** Lookup a single quest plus its chain neighbors and what its rewards need to render. */
export async function findQuest(
  id: string,
  locale: string,
): Promise<{
  quest: Quest;
  chain: Quest[];
  byId: Map<string, Quest>;
  dict: Dict;
  label: string;
  icons: Record<string, unknown>;
  iconsHash?: string;
} | null> {
  const [{ byId, chains, dict, groups }, index, version] = await Promise.all([
    loadQuests(locale),
    fetchDatabaseIndex(APP_NAME),
    fetchVersion(APP_NAME),
  ]);
  const quest = byId.get(id);
  if (!quest) return null;
  const icons: Record<string, unknown> = {};
  for (const ref of quest.props.rewardItems ?? []) {
    for (const cat of index) {
      const hit = cat.items.find((i) => i.id === ref.id);
      if (hit?.icon && typeof hit.icon === "object") {
        icons[ref.id] = hit.icon;
        break;
      }
    }
  }
  return {
    quest,
    chain: chains.get(id) ?? [quest],
    byId,
    dict,
    label: groups.find((g) => g.type === quest.type)!.label,
    icons,
    iconsHash: version.more.icons,
  };
}
