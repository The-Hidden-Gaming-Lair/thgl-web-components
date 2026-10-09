import Link from "next/link";
import { localizePath, type Dict } from "@repo/lib";
import { QUEST_CATEGORY_ACCENT, questLabel, type Quest } from "./quests";

/**
 * Grouped grid of quest cards, one section per category. Each card
 * shows the quest name + chapter + episode + a "Part N of M" chain
 * indicator when the quest is one piece of a multi-part chain.
 */
export function QuestList({
  groups,
  chains,
  dict,
  locale = "en",
}: {
  groups: Array<{ type: Quest["type"]; label: string; quests: Quest[] }>;
  chains: Map<string, Quest[]>;
  dict: Dict;
  locale?: string;
}) {
  return (
    <div className="space-y-10">
      {groups
        .filter((g) => g.quests.length > 0)
        .map((group) => (
          <section key={group.type} className="space-y-4">
            <header className="flex items-baseline justify-between border-b border-slate-800 pb-2">
              <h2 className="text-lg font-semibold">{group.label}</h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {group.quests.length}
              </span>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.quests.map((quest) => {
                const chain = chains.get(quest.id);
                const partOf =
                  chain && chain.length > 1
                    ? {
                        index: chain.findIndex((c) => c.id === quest.id) + 1,
                        total: chain.length,
                      }
                    : null;
                return (
                  <Link
                    key={quest.id}
                    href={localizePath(`/db/quests/${quest.id}`, locale)}
                    prefetch={false}
                    className="group border border-slate-800 hover:border-amber-800/50 rounded-lg p-4 transition-colors hover:bg-slate-900/50 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium group-hover:text-amber-400 transition-colors line-clamp-2">
                        {quest.props.name}
                      </h3>
                      {partOf && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 tabular-nums ${QUEST_CATEGORY_ACCENT[group.type]}`}
                        >
                          {questLabel(dict, "partShort", {
                            part: String(partOf.index),
                            total: String(partOf.total),
                          })}
                        </span>
                      )}
                    </div>
                    {(quest.props.chapterName || quest.props.episode) && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {quest.props.chapterName ?? ""}
                        {quest.props.chapterName && quest.props.episode
                          ? " · "
                          : ""}
                        {quest.props.episode ?? ""}
                      </p>
                    )}
                    {quest.props.questNpcName && (
                      <p className="text-[11px] text-slate-500 pt-1 mt-auto">
                        {questLabel(dict, "npcShort", {
                          name: quest.props.questNpcName,
                        })}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
    </div>
  );
}
