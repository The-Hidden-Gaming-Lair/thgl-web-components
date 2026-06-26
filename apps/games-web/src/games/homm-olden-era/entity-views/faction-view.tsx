import { resolveDict } from "@/lib/db/resolve-dict";
import { BonusList } from "@/games/homm-olden-era/bonus-display";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import { EntityLink, EntityLinkCard } from "@/games/homm-olden-era/cross-link";
import { BuildTree } from "@/games/homm-olden-era/build-tree";

const APP_NAME = "homm-olden-era";

type UltimateSkill = {
  id: string;
  classType: string;
  requiredSkills: { skill: string; level: number }[];
  bonuses: { type: string; params: (string | number)[] }[];
};

type FactionProps = {
  biome?: string;
  resourceName?: string;
  lawTiers?: {
    unlockAt: number;
    lawCount: number;
    /** The in-game columns for this tier (typically 2), each holding the law
     *  ids it contains in display order. */
    groups?: { laws: string[] }[];
  }[];
  ultimateSkills?: UltimateSkill[];
  faction?: string;
  bonuses?: {
    type: string;
    params: (string | number)[];
    activationLevel?: number;
    upgrade?: { increment: number; levelStep: number };
  }[];
  /** For faction-law entries: point cost to unlock the first tier. Used to
   *  sort laws cheap-first on the faction page. */
  unlockCost?: number;
  /** For faction-law entries: per-tier upgrade table with own cost + bonuses. */
  tiers?: {
    cost: number;
    bonuses: {
      type: string;
      params: (string | number)[];
      activationLevel?: number;
    }[];
  }[];
  /** For specializations: authoritative `{N}` values resolved from the
   *  tooltip-script args (preferred over the bonus-param scan when present). */
  descParams?: number[];
};

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function substituteTemplate(
  text: string,
  bonuses?: FactionProps["bonuses"],
  descParams?: number[],
): string {
  // Authoritative pre-resolved values (specializations) win over the heuristic
  // bonus-param scan — the latter can't see script literals / level steps.
  if (descParams && descParams.length > 0) {
    let result = text;
    for (let i = 0; i < descParams.length; i++) {
      result = result.replace(`{${i}}`, String(descParams[i]));
    }
    return result.replace(/\{(\d+)\}/g, "");
  }
  if (!bonuses || bonuses.length === 0) return text;
  const values: string[] = [];
  for (const bonus of bonuses) {
    for (const p of bonus.params) {
      const num = parseFloat(String(p));
      if (
        !isNaN(num) &&
        num !== 0 &&
        String(p) !== "true" &&
        String(p) !== "false"
      ) {
        const abs = Math.abs(num);
        // Push the bare integer for fractional values (e.g. 0.2 → "20") rather
        // than appending "%" — the source text almost always already carries
        // the `%` after `{0}` (e.g. "+{0}% Law points"), so appending here
        // produces `%%`. Matches the convention used by the entity-tooltip
        // route and spell-view's placeholder filler.
        values.push(
          abs > 0 && abs < 1 ? `${Math.round(abs * 100)}` : String(abs),
        );
      }
    }
    if (bonus.upgrade) {
      const inc = bonus.upgrade.increment;
      if (inc !== 0) {
        const abs = Math.abs(inc);
        values.push(
          abs > 0 && abs < 1 ? `${Math.round(abs * 100)}` : String(abs),
        );
      }
      if (bonus.upgrade.levelStep) values.push(String(bonus.upgrade.levelStep));
    }
  }
  let result = text;
  for (let i = 0; i < values.length; i++) {
    result = result.replace(`{${i}}`, values[i]);
  }
  result = result.replace(/\{(\d+)\}/g, "");
  return result;
}

export function FactionView({
  name,
  desc,
  icon,
  props,
  dict,
  database,
  locale = "en",
  entryId,
  isFactionLaw = false,
  iconsHash,
}: {
  name: string;
  desc: string;
  icon?: IconSprite;
  props: FactionProps;
  dict: Record<string, string>;
  database: any[];
  locale?: string;
  entryId?: string;
  isFactionLaw?: boolean;
  iconsHash?: string;
}) {
  const isFaction = !!props.biome;
  const isSpecialization = !isFaction && !isFactionLaw;
  const resolvedDesc =
    desc !== name
      ? substituteTemplate(desc, props.bonuses, props.descParams)
      : "";

  if (isSpecialization) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          {icon && (
            <SpriteIcon
              icon={icon}
              appName={APP_NAME}
              size={64}
              iconsHash={iconsHash}
            />
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-900/30 text-cyan-400 border border-cyan-800/50">
              {resolveDict(dict, "ui.specialization")}
            </span>
          </div>
        </div>

        {resolvedDesc && (
          <p className="text-muted-foreground italic border-l-2 border-amber-800/50 pl-3">
            {resolvedDesc}
          </p>
        )}

        {props.bonuses && props.bonuses.length > 0 && (
          <div>
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
              {resolveDict(dict, "ui.effects")}
            </h2>
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4">
              <BonusList bonuses={props.bonuses} dict={dict} locale={locale} />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isFactionLaw) {
    const tiers = props.tiers ?? [];
    const TIER_LABELS = ["Basic", "Upgraded", "Tier 3", "Tier 4"];
    // The law's description text (e.g. "Your cities generate +{0}% Law
    // points.") is the primary way the game communicates a law's effect.
    // Each tier upgrades the underlying bonus value, so we render the same
    // description per tier with that tier's own numbers filled in. This is
    // strictly more informative than the raw `BonusList` (which would render
    // unhelpful rows like "Side Stat: City Exp Coef" or "Weekly city units:
    // +aqualotl/2") and avoids the redundancy of showing both.
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          {icon && (
            <SpriteIcon
              icon={icon}
              appName={APP_NAME}
              size={64}
              iconsHash={iconsHash}
            />
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {props.faction && (
                <span className="text-xs text-muted-foreground capitalize">
                  {resolveDict(dict, `faction_${props.faction}`)}
                </span>
              )}
              {typeof props.unlockCost === "number" && (
                <span className="text-xs px-2 py-0.5 rounded bg-amber-900/40 text-amber-400 border border-amber-800/50">
                  {props.unlockCost} {resolveDict(dict, "ui.pts")}
                </span>
              )}
            </div>
          </div>
        </div>

        {tiers.length > 0 && desc && desc !== name ? (
          <div>
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
              {resolveDict(dict, "ui.effects")}
            </h2>
            <div className="space-y-2">
              {tiers.map((tier, i) => {
                const tierText = substituteTemplate(desc, tier.bonuses);
                return (
                  <div
                    key={i}
                    className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase tracking-wider text-amber-400">
                        {TIER_LABELS[i] ?? `Tier ${i + 1}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {tier.cost} {resolveDict(dict, "ui.pts")}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-line">{tierText}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {resolvedDesc && (
              <p className="text-muted-foreground italic border-l-2 border-amber-800/50 pl-3">
                {resolvedDesc}
              </p>
            )}
            {props.bonuses && props.bonuses.length > 0 && (
              <div>
                <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
                  {resolveDict(dict, "ui.effects")}
                </h2>
                <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4">
                  <BonusList
                    bonuses={props.bonuses}
                    dict={dict}
                    locale={locale}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        {icon && (
          <SpriteIcon
            icon={icon}
            appName={APP_NAME}
            size={64}
            iconsHash={iconsHash}
          />
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {props.biome && (
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 capitalize">
                {props.biome}
              </span>
            )}
            {props.resourceName && (
              <span className="text-xs text-muted-foreground capitalize">
                {resolveDict(dict, "ui.resource_prefix")} {props.resourceName}
              </span>
            )}
          </div>
        </div>
      </div>

      {resolvedDesc && (
        <p className="text-muted-foreground italic border-l-2 border-amber-800/50 pl-3">
          {resolvedDesc}
        </p>
      )}

      {props.lawTiers && props.lawTiers.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {resolveDict(dict, "ui.faction_law_tiers")}
          </h2>
          <div className="grid grid-cols-5 gap-1">
            {props.lawTiers.map((tier, i) => (
              <div
                key={i}
                className="bg-slate-900/50 border border-slate-800 rounded px-3 py-2 text-center"
              >
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {tier.unlockAt === 0
                    ? resolveDict(dict, "ui.start")
                    : `${tier.unlockAt} ${resolveDict(dict, "ui.pts")}`}
                </div>
                <div className="text-lg font-semibold text-amber-400">
                  {tier.lawCount}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {resolveDict(dict, "ui.laws")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {props.ultimateSkills && props.ultimateSkills.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            Ultimate Skills
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {props.ultimateSkills.map((ult) => {
              const ultName = resolveDict(dict, ult.id);
              const ultDesc = resolveDict(dict, `${ult.id}_desc`);
              const hasDesc = ultDesc && ultDesc !== `${ult.id}_desc`;
              return (
                <div
                  key={ult.id}
                  className="border border-slate-800/60 rounded-lg bg-slate-900/20 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{ultName}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${ult.classType === "might" ? "text-red-400 border-red-800/50 bg-red-900/20" : "text-indigo-400 border-indigo-800/50 bg-indigo-900/20"}`}
                    >
                      {ult.classType === "might"
                        ? resolveDict(dict, "ui.might")
                        : resolveDict(dict, "ui.magic_class")}
                    </span>
                  </div>
                  {hasDesc && (
                    <p className="text-xs text-muted-foreground">
                      {substituteTemplate(ultDesc, ult.bonuses)}
                    </p>
                  )}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs text-muted-foreground shrink-0">
                      Requires:
                    </span>
                    {ult.requiredSkills.map((req, ri) => (
                      <span key={ri} className="inline-flex items-center">
                        {ri > 0 && (
                          <span className="text-slate-600 mx-0.5">·</span>
                        )}
                        <EntityLink
                          itemId={req.skill}
                          database={database}
                          dict={dict}
                          locale={locale}
                          iconsHash={iconsHash}
                          showIcon={false}
                          className="text-xs"
                        />
                      </span>
                    ))}
                    <span className="text-xs text-muted-foreground">
                      (all at Lv.{ult.requiredSkills[0]?.level})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(() => {
        const laws = database
          .filter((cat: any) => cat.type === "faction_laws")
          .flatMap((cat: any) => cat.items)
          .filter((item: any) => item.groupId === entryId);
        if (laws.length === 0) return null;

        const ptsLabel = resolveDict(dict, "ui.pts");
        const tierLabel = resolveDict(dict, "ui.law_tier");
        const unlockLabel = resolveDict(dict, "ui.law_tier_unlock");
        const tierPtsLabel = resolveDict(dict, "ui.law_tier_points");

        const lawById = new Map<string, any>(laws.map((l: any) => [l.id, l]));
        const subtitleFor = (law: any) =>
          typeof law?.props?.unlockCost === "number"
            ? `${law.props.unlockCost} ${ptsLabel}`
            : undefined;

        const tiers = props.lawTiers ?? [];
        // Track which laws were placed via lawTiers so any stragglers (laws
        // that exist in the database but aren't referenced by a tier) can
        // still be rendered in a fallback section — nothing gets dropped.
        const placed = new Set<string>();
        for (const tier of tiers) {
          for (const group of tier.groups ?? []) {
            for (const lawId of group.laws) placed.add(lawId);
          }
        }
        const leftovers = laws.filter((l: any) => !placed.has(l.id));

        return (
          <div>
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
              {resolveDict(dict, "faction_laws")}
            </h2>

            {tiers.length > 0 ? (
              <div className="space-y-4">
                {tiers.map((tier, ti) => {
                  const groups = tier.groups ?? [];
                  if (groups.length === 0) return null;
                  return (
                    <div
                      key={ti}
                      className="border border-slate-800/60 rounded-lg bg-slate-900/20 p-3"
                    >
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-xs uppercase tracking-wider text-amber-400">
                          {tierLabel} {ti + 1}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {unlockLabel} {tier.unlockAt} {tierPtsLabel}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {groups.map((group, gi) => (
                          <div key={gi} className="flex flex-col gap-2">
                            {group.laws.map((lawId) => (
                              <EntityLinkCard
                                key={lawId}
                                itemId={lawId}
                                database={database}
                                locale={locale}
                                dict={dict}
                                iconsHash={iconsHash}
                                subtitle={subtitleFor(lawById.get(lawId))}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {leftovers.length > 0 && (
              <div className={tiers.length > 0 ? "mt-4" : undefined}>
                <div className="flex flex-wrap gap-2">
                  {leftovers
                    .sort(
                      (a: any, b: any) =>
                        (a.props?.unlockCost ?? 0) - (b.props?.unlockCost ?? 0),
                    )
                    .map((law: any) => (
                      <EntityLinkCard
                        key={law.id}
                        itemId={law.id}
                        database={database}
                        locale={locale}
                        dict={dict}
                        iconsHash={iconsHash}
                        subtitle={subtitleFor(law)}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {(() => {
        const specs = database
          .filter((cat: any) => cat.type === "specializations")
          .flatMap((cat: any) => cat.items)
          .filter((item: any) => item.groupId === entryId);
        if (specs.length === 0) return null;
        return (
          <div>
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
              {resolveDict(dict, "specializations")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {specs.map((spec: any) => (
                <EntityLinkCard
                  key={spec.id}
                  itemId={spec.id}
                  database={database}
                  locale={locale}
                  dict={dict}
                  iconsHash={iconsHash}
                />
              ))}
            </div>
          </div>
        );
      })()}

      {entryId && (
        <BuildTree
          factionId={entryId}
          database={database as any}
          dict={dict}
          locale={locale}
          iconsHash={iconsHash}
        />
      )}
    </div>
  );
}
