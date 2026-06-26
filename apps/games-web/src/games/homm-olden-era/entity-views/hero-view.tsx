import { localizePath } from "@repo/lib";
import Link from "next/link";
import { resolveDict } from "@/lib/db/resolve-dict";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import { MechanicTerm } from "@/lib/db/mechanic-term";
import {
  EntityLink,
  EntityLinkCard,
  RelatedSection,
} from "@/games/homm-olden-era/cross-link";
import {
  ResourceCost,
  buildResourceIconLookup,
} from "@/games/homm-olden-era/resource-cost";

const APP_NAME = "homm-olden-era";

type HeroProps = {
  faction: string;
  classType: string;
  costGold: number;
  offence: number;
  defence: number;
  spellPower: number;
  intelligence: number;
  specialization: string;
  startingArmy?: { unit: string; min: number; max: number }[];
  startSkills?: string[];
  skillWeights?: { skill: string; weight: number; pct: number }[];
};

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type SpecBonus = {
  params: (string | number)[];
  upgrade?: { increment: number; levelStep?: number };
};

function substituteSpecTemplate(
  text: string,
  bonuses?: SpecBonus[],
  descParams?: number[],
): string {
  // Authoritative tooltip-script values win over the heuristic param scan.
  if (descParams && descParams.length > 0) {
    let result = text;
    for (let i = 0; i < descParams.length; i++) {
      result = result.replace(`{${i}}`, String(descParams[i]));
    }
    return result.replace(/\{(\d+)\}/g, "");
  }
  if (!bonuses || bonuses.length === 0) return text.replace(/\{(\d+)\}/g, "");
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
        values.push(
          abs > 0 && abs < 1 ? String(Math.round(abs * 100)) : String(abs),
        );
      }
    }
    if (bonus.upgrade) {
      const inc = bonus.upgrade.increment;
      if (inc !== 0) {
        const abs = Math.abs(inc);
        values.push(
          abs > 0 && abs < 1 ? String(Math.round(abs * 100)) : String(abs),
        );
      }
      if (bonus.upgrade.levelStep) values.push(String(bonus.upgrade.levelStep));
    }
  }
  let result = text;
  for (let i = 0; i < values.length; i++) {
    result = result.replace(`{${i}}`, values[i]);
  }
  return result.replace(/\{(\d+)\}/g, "");
}

export function HeroView({
  name,
  desc,
  icon,
  props,
  dict,
  database,
  locale = "en",
  iconsHash,
}: {
  name: string;
  desc: string;
  icon?: IconSprite;
  props: HeroProps;
  dict: Record<string, string>;
  database: any[];
  locale?: string;
  iconsHash?: string;
}) {
  const resourceIcons = buildResourceIconLookup(database);
  const specName = props.specialization
    ? resolveDict(
        dict,
        `${props.specialization.replace("_specialization", "")}_spec`,
      )
    : undefined;
  // Prefer the full `<id>_specialization_desc` over the shorter `_spec_desc`.
  // The two can disagree (e.g. Merry Elias's short description says
  // "Spellbook one more time per battle round" but the accurate mechanic
  // is +1 global-map spell cap, captured in `_specialization_desc`).
  const rawSpecDesc = props.specialization
    ? (() => {
        const fullKey = `${props.specialization}_desc`;
        const fullText = resolveDict(dict, fullKey);
        if (fullText && fullText !== fullKey) return fullText;
        const baseId = props.specialization.replace("_specialization", "");
        return resolveDict(dict, `${baseId}_spec_desc`);
      })()
    : undefined;
  const specProps = props.specialization
    ? ((database
        .find((c: any) => c.type === "specializations")
        ?.items?.find((i: any) => i.id === props.specialization)
        ?.props as any) ?? undefined)
    : undefined;
  const specBonuses = specProps?.bonuses as
    | {
        params: (string | number)[];
        upgrade?: { increment: number; levelStep?: number };
      }[]
    | undefined;
  const specDescParams = specProps?.descParams as number[] | undefined;
  const specDesc = rawSpecDesc
    ? substituteSpecTemplate(rawSpecDesc, specBonuses, specDescParams)
    : undefined;

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
            <span
              className={`text-sm px-2.5 py-0.5 rounded border ${
                props.classType === "might"
                  ? "bg-red-900/40 text-red-400 border-red-800/50"
                  : "bg-indigo-900/40 text-indigo-400 border-indigo-800/50"
              }`}
            >
              {props.classType === "might"
                ? resolveDict(dict, "ui.might")
                : resolveDict(dict, "ui.magic_class")}
            </span>
            <Link
              prefetch={false}
              href={localizePath(`/db/factions/${props.faction}`, locale)}
              className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              {resolveDict(dict, `faction_${props.faction}`)}
            </Link>
            <ResourceCost
              name="gold"
              amount={props.costGold}
              resourceIcons={resourceIcons}
              iconsHash={iconsHash}
              dict={dict}
              size={18}
            />
          </div>
        </div>
      </div>

      {desc && desc !== name && (
        <p className="text-muted-foreground italic border-l-2 border-amber-800/50 pl-3">
          {desc}
        </p>
      )}

      <div className="grid grid-cols-4 gap-1">
        <StatBox
          label={resolveDict(dict, "ui.offence")}
          value={props.offence}
          color="text-red-400"
          mechanicKey="offence"
          locale={locale}
        />
        <StatBox
          label={resolveDict(dict, "ui.def")}
          value={props.defence}
          color="text-blue-400"
          mechanicKey="defence"
          locale={locale}
        />
        <StatBox
          label={resolveDict(dict, "ui.spell_power")}
          value={props.spellPower}
          color="text-purple-400"
          mechanicKey="spellpower"
          locale={locale}
        />
        <StatBox
          label={resolveDict(dict, "ui.intelligence")}
          value={props.intelligence}
          color="text-cyan-400"
          mechanicKey="intelligence"
          locale={locale}
        />
      </div>

      {specName && specName !== props.specialization && (
        <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider text-amber-500 mb-1">
              {resolveDict(dict, "ui.specialization")}
            </h2>
            {props.specialization && (
              <Link
                prefetch={false}
                href={localizePath(
                  `/db/factions/${props.specialization}`,
                  locale,
                )}
                className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
              >
                {resolveDict(dict, "ui.view_details")}
              </Link>
            )}
          </div>
          <p className="font-medium">{specName}</p>
          {rawSpecDesc &&
            rawSpecDesc !== `${props.specialization}_desc` &&
            rawSpecDesc !==
              `${props.specialization.replace("_specialization", "")}_spec_desc` && (
              <p className="text-sm text-muted-foreground mt-1">{specDesc}</p>
            )}
        </div>
      )}

      {props.startingArmy && props.startingArmy.length > 0 && (
        <RelatedSection title={resolveDict(dict, "ui.army")}>
          <div className="space-y-1">
            {props.startingArmy.map((entry) => (
              <div
                key={entry.unit}
                className="flex items-center justify-between bg-slate-900/30 border border-slate-800/50 rounded px-3 py-2"
              >
                <EntityLink
                  itemId={entry.unit}
                  database={database}
                  locale={locale}
                  dict={dict}
                  iconsHash={iconsHash}
                />
                <span className="text-sm text-muted-foreground">
                  {entry.min}–{entry.max}
                </span>
              </div>
            ))}
          </div>
        </RelatedSection>
      )}

      {props.startSkills && props.startSkills.length > 0 && (
        <RelatedSection title={resolveDict(dict, "ui.skills_label")}>
          <div className="flex flex-wrap gap-2">
            {props.startSkills.map((skill) => (
              <EntityLinkCard
                key={skill}
                itemId={skill}
                database={database}
                locale={locale}
                dict={dict}
                iconsHash={iconsHash}
              />
            ))}
          </div>
        </RelatedSection>
      )}

      {props.skillWeights && props.skillWeights.length > 0 && (
        <RelatedSection title={resolveDict(dict, "ui.skill_weights")}>
          <div className="space-y-1">
            {props.skillWeights.map((sw) => {
              const maxWeight = props.skillWeights![0].weight;
              const barWidth = (sw.weight / maxWeight) * 100;
              return (
                <div key={sw.skill} className="flex items-center gap-2 text-sm">
                  <div className="w-36 shrink-0">
                    <EntityLink
                      itemId={sw.skill}
                      database={database}
                      locale={locale}
                      dict={dict}
                      iconsHash={iconsHash}
                    />
                  </div>
                  <div className="flex-1 h-5 bg-slate-900/50 rounded overflow-hidden">
                    <div
                      className="h-full bg-amber-800/40 rounded"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right tabular-nums">
                    {sw.pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </RelatedSection>
      )}

      {(() => {
        const factionEntry = database
          .filter((cat: any) => cat.type === "factions")
          .flatMap((cat: any) => cat.items)
          .find((f: any) => f.id === props.faction);
        const ultimates = (factionEntry?.props as any)?.ultimateSkills?.filter(
          (u: any) => u.classType === props.classType,
        );
        if (!ultimates?.length) return null;
        return (
          <RelatedSection title="Ultimate Skills">
            <div className="space-y-2">
              {ultimates.map((ult: any) => {
                const ultName = resolveDict(dict, ult.id);
                let ultDesc = resolveDict(dict, `${ult.id}_desc`);
                const hasDesc = ultDesc && ultDesc !== `${ult.id}_desc`;
                if (hasDesc) {
                  const vals: string[] = [];
                  for (const b of ult.bonuses ?? []) {
                    for (const p of b.params ?? []) {
                      const n = parseFloat(String(p));
                      if (
                        !isNaN(n) &&
                        n !== 0 &&
                        String(p) !== "true" &&
                        String(p) !== "false"
                      ) {
                        const abs = Math.abs(n);
                        vals.push(
                          abs > 0 && abs < 1
                            ? `${Math.round(abs * 100)}%`
                            : String(abs),
                        );
                      }
                    }
                  }
                  ultDesc = ultDesc.replace(
                    /\{(\d+)\}/g,
                    (_, idx) => vals[parseInt(idx)] ?? "",
                  );
                }
                return (
                  <div
                    key={ult.id}
                    className="border border-slate-800/60 rounded-lg bg-slate-900/20 p-3 space-y-1.5"
                  >
                    <div className="font-medium">{ultName}</div>
                    {hasDesc && (
                      <p className="text-xs text-muted-foreground">{ultDesc}</p>
                    )}
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs text-muted-foreground shrink-0">
                        Requires:
                      </span>
                      {ult.requiredSkills.map((req: any, ri: number) => (
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
                        (all Lv.{ult.requiredSkills[0]?.level})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </RelatedSection>
        );
      })()}
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
  mechanicKey,
  locale,
}: {
  label: string;
  value: number;
  color: string;
  mechanicKey?: string;
  locale?: string;
}) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded px-3 py-2 text-center">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {mechanicKey ? (
          <MechanicTerm termKey={mechanicKey} locale={locale}>
            {label}
          </MechanicTerm>
        ) : (
          label
        )}
      </div>
      <div className={`text-2xl font-bold ${color} mt-0.5`}>{value}</div>
    </div>
  );
}
