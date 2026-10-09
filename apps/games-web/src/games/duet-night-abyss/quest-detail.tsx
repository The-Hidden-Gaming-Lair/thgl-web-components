import Link from "next/link";
import { localizePath, type Dict } from "@repo/lib";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import { resolveDict } from "@/lib/db/resolve-dict";
import { QUEST_CATEGORY_ACCENT, questLabel, type Quest } from "./quests";

/**
 * Structured quest detail page. Renders:
 *   1. Breadcrumb (Home → Quests → <Category> → <Quest name>)
 *   2. Header with category pill + auto-start badge, then the in-game
 *      quest description
 *   3. The chain visualisation when this quest is part of a multi-part
 *      episode — highlights the current step and lets users jump
 *      across the chain.
 *   4. A definition list of all the structured fields (chapter,
 *      episode, NPC, unlock/show/requires conditions with cross-links)
 *   5. Rewards as codex links (icon, name, count).
 *
 * Everything is localized by `loadQuests` (game text) and the app
 * dictionary (labels); cross-links show the target quest's title.
 */
export function QuestDetail({
  quest,
  chain,
  byId,
  dict,
  categoryLabel,
  icons,
  iconsHash,
  locale = "en",
}: {
  quest: Quest;
  /** Ordered list of quests in this quest's episode, or `[quest]` when alone. */
  chain: Quest[];
  byId: Map<string, Quest>;
  dict: Dict;
  categoryLabel: string;
  icons: Record<string, unknown>;
  iconsHash?: string;
  locale?: string;
}) {
  const { props } = quest;
  const partIdx = chain.findIndex((q) => q.id === quest.id);
  const isInChain = chain.length > 1;
  const t = (key: string, vars?: Record<string, string>) =>
    questLabel(dict, key, vars);

  const accent = QUEST_CATEGORY_ACCENT[quest.type];

  // The data files often duplicate `showCondition` and
  // `unlockCondition` when they refer to the same prereq. Render one
  // combined "Unlocks after" line in that case and two specific lines
  // ("Appears after" + "Available after") when they diverge.
  const sameUnlockShow =
    props.unlockCondition && props.showCondition === props.unlockCondition;

  /** Render a cross-link to another quest if we have its id, else plain text. */
  const linkOrText = (id: string | undefined, fallback: string | undefined) => {
    if (!fallback) return null;
    const target = id ? byId.get(id) : undefined;
    if (target) {
      return (
        <Link
          href={localizePath(`/db/quests/${target.id}`, locale)}
          prefetch={false}
          className="text-amber-400 hover:text-amber-300 transition-colors"
        >
          {target.props.name}
        </Link>
      );
    }
    return <span>{fallback}</span>;
  };

  const rewards = (props.rewardItems ?? []).filter((r) => dict[r.id]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <Breadcrumb
        crumbs={[
          { label: t("title"), href: "/db/quests" },
          { label: categoryLabel },
          { label: props.name },
        ]}
        locale={locale}
        dict={dict}
      />

      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded border ${accent}`}>
            {categoryLabel}
          </span>
          {props.autoStart && (
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {t("autoStarts")}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{props.name}</h1>
        {(props.chapterName || props.episode) && (
          <p className="text-sm text-muted-foreground">
            {props.chapterName}
            {props.chapterName && props.episode && " · "}
            {props.episode}
          </p>
        )}
      </div>

      {quest.desc && (
        <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
          {quest.desc}
        </p>
      )}

      {isInChain && (
        <section className="border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("chain")}
            </h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {t("partOf", {
                part: String(partIdx + 1),
                total: String(chain.length),
              })}
            </span>
          </div>
          <ol className="space-y-1.5">
            {chain.map((step, i) => {
              const isCurrent = step.id === quest.id;
              return (
                <li key={step.id}>
                  {isCurrent ? (
                    <div className="px-3 py-2 rounded bg-amber-900/30 border border-amber-800/50 text-amber-400 text-sm">
                      <span className="tabular-nums mr-2">{i + 1}.</span>
                      {step.props.name}
                    </div>
                  ) : (
                    <Link
                      href={localizePath(`/db/quests/${step.id}`, locale)}
                      prefetch={false}
                      className="block px-3 py-2 rounded bg-slate-900/40 hover:bg-slate-900/70 border border-transparent hover:border-slate-800 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="tabular-nums mr-2">{i + 1}.</span>
                      {step.props.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
        {props.chapterName && (
          <Row label={t("chapter")}>{props.chapterName}</Row>
        )}
        {props.episode && <Row label={t("episode")}>{props.episode}</Row>}
        {props.questNpcName && <Row label={t("npc")}>{props.questNpcName}</Row>}
        {sameUnlockShow ? (
          <Row label={t("unlocksAfter")}>
            {linkOrText(props.unlockCondition, props.unlockConditionName)}
          </Row>
        ) : (
          <>
            {props.showConditionName && (
              <Row label={t("appearsAfter")}>
                {linkOrText(props.showCondition, props.showConditionName)}
              </Row>
            )}
            {props.unlockConditionName && (
              <Row label={t("availableAfter")}>
                {linkOrText(props.unlockCondition, props.unlockConditionName)}
              </Row>
            )}
          </>
        )}
        {props.requiresQuestName && (
          <Row label={t("requiresQuest")}>
            {linkOrText(props.requiresQuest, props.requiresQuestName)}
          </Row>
        )}
      </dl>

      {rewards.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            {t("rewards")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {rewards.map((r) => {
              const icon = icons[r.id] as
                | Parameters<typeof SpriteIcon>[0]["icon"]
                | undefined;
              return (
                <Link
                  key={`${r.section}/${r.id}`}
                  href={localizePath(`/db/${r.section}/${r.id}`, locale)}
                  prefetch={false}
                  className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900/60 py-1 pr-2.5 text-xs hover:border-amber-700/70 hover:bg-slate-900 transition-colors"
                  style={{ paddingLeft: icon ? 4 : 10 }}
                >
                  {icon && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                      <SpriteIcon
                        icon={icon}
                        appName="duet-night-abyss"
                        size={20}
                        iconsHash={iconsHash}
                      />
                    </span>
                  )}
                  <span className="text-slate-200">
                    {resolveDict(dict, r.id)}
                  </span>
                  {typeof r.count === "number" && r.count > 1 && (
                    <span className="font-mono text-muted-foreground">
                      ×{r.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground self-center">
        {label}
      </dt>
      <dd>{children}</dd>
    </>
  );
}
