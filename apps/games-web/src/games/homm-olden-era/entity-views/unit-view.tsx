import { localizePath } from "@repo/lib";
import Link from "next/link";
import { resolveDict } from "@/lib/db/resolve-dict";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import { MechanicTerm } from "@/lib/db/mechanic-term";
import {
  EntityLinkCard,
  RelatedSection,
  findItem,
} from "@/games/homm-olden-era/cross-link";
import {
  ResourceCostList,
  buildResourceIconLookup,
} from "@/games/homm-olden-era/resource-cost";

const APP_NAME = "homm-olden-era";

type DmgMod = { t: string; v: number };

type UnitProps = {
  faction: string;
  tier: number;
  upgradeLevel: string;
  baseId: string;
  squadValue: number;
  expBonus?: number;
  hp: number;
  offence: number;
  defence: number;
  damageMin: number;
  damageMax: number;
  initiative: number;
  speed: number;
  nativeBiome?: string;
  inDmgMods?: DmgMod[];
  outDmgMods?: DmgMod[];
  cost: { name: string; cost: number }[];
  abilities: string[];
  passives: string[];
  /** Per-ability numeric params keyed by the ability's `name` sid. */
  abilityParams?: Record<string, number[]>;
  /** Per-passive numeric params keyed by the passive's `name` sid. */
  passiveParams?: Record<string, number[]>;
  /** Focus-charge cost to activate each ability, keyed by its `name` sid. */
  abilityCosts?: Record<string, number>;
  altAttacks: string[];
  baseClass: string;
};

const BIOME_LABELS: Record<string, string> = {
  Grass: "Grass",
  Deathland: "Deathland",
  Dirt: "Dirt",
  Autumn: "Autumn",
  Lava: "Lava",
  Snow: "Snow",
  Sand: "Sand",
};

const DMG_MOD_LABELS: Record<string, string> = {
  shoot_attack: "Ranged",
  melee_attack: "Melee",
  magic_attack: "Magic",
  magic_damage: "Magic",
  pure_damage: "Pure",
};

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export function UnitView({
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
  props: UnitProps;
  dict: Record<string, string>;
  database: any[];
  locale?: string;
  iconsHash?: string;
}) {
  const upgLabel =
    props.upgradeLevel === "upgrade"
      ? resolveDict(dict, "ui.upgrade_label")
      : props.upgradeLevel === "alt_upgrade"
        ? resolveDict(dict, "ui.alt_upgrade")
        : resolveDict(dict, "ui.base");

  const resourceIcons = buildResourceIconLookup(database);

  const baseId = props.baseId;
  const upgradeChain = [baseId, `${baseId}_upg`, `${baseId}_upg_alt`]
    .map((uid) => findItem(database, uid))
    .filter(Boolean);

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
            <span className="text-sm px-2.5 py-0.5 rounded bg-amber-900/40 text-amber-400 border border-amber-800/50">
              {resolveDict(dict, "ui.tier")} {props.tier}
            </span>
            <span className="text-sm px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {upgLabel}
            </span>
            {findItem(database, props.faction) ? (
              <Link
                prefetch={false}
                href={localizePath(`/db/factions/${props.faction}`, locale)}
                className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
              >
                {resolveDict(dict, `faction_${props.faction}`)}
              </Link>
            ) : (
              <span className="text-sm text-slate-300">
                {resolveDict(dict, `faction_${props.faction}`)}
              </span>
            )}
          </div>
        </div>
      </div>

      {desc && desc !== name && (
        <p className="text-muted-foreground italic border-l-2 border-amber-800/50 pl-3">
          {desc}
        </p>
      )}

      <div className="grid grid-cols-4 gap-1">
        <StatCell
          label={resolveDict(dict, "ui.hp")}
          value={props.hp}
          color="text-green-400"
          mechanicKey="health"
          locale={locale}
        />
        <StatCell
          label={resolveDict(dict, "ui.atk")}
          value={props.offence}
          color="text-red-400"
          mechanicKey="attack"
          locale={locale}
        />
        <StatCell
          label={resolveDict(dict, "ui.def")}
          value={props.defence}
          color="text-blue-400"
          mechanicKey="defence"
          locale={locale}
        />
        <StatCell
          label={resolveDict(dict, "ui.dmg")}
          value={`${props.damageMin}–${props.damageMax}`}
          color="text-orange-400"
          mechanicKey="damage"
          locale={locale}
        />
        <StatCell
          label={resolveDict(dict, "ui.init")}
          value={props.initiative}
          color="text-purple-400"
          mechanicKey="initiative"
          locale={locale}
        />
        <StatCell
          label={resolveDict(dict, "ui.speed")}
          value={props.speed}
          color="text-cyan-400"
          mechanicKey="speed"
          locale={locale}
        />
        <StatCell
          label={resolveDict(dict, "ui.value")}
          value={props.squadValue}
          color="text-yellow-400"
          mechanicKey="value"
          locale={locale}
        />
      </div>

      {props.cost?.length > 0 && (
        <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded px-3 py-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {resolveDict(dict, "ui.cost")}
          </span>
          <ResourceCostList
            costs={props.cost}
            resourceIcons={resourceIcons}
            iconsHash={iconsHash}
            dict={dict}
            size={20}
          />
        </div>
      )}

      {(props.nativeBiome ||
        props.expBonus ||
        (props.inDmgMods && props.inDmgMods.length > 0) ||
        (props.outDmgMods && props.outDmgMods.length > 0)) && (
        <div className="flex gap-2 flex-wrap">
          {props.nativeBiome && (
            <div className="bg-slate-900/50 border border-slate-800 rounded px-3 py-1.5 text-sm">
              <span className="text-muted-foreground">Native Terrain: </span>
              <span className="text-green-400">
                {BIOME_LABELS[props.nativeBiome] ?? props.nativeBiome}
              </span>
            </div>
          )}
          {props.expBonus != null && (
            <div className="bg-slate-900/50 border border-slate-800 rounded px-3 py-1.5 text-sm">
              <span className="text-muted-foreground">XP Value: </span>
              <span className="text-yellow-400">{props.expBonus}</span>
            </div>
          )}
          {props.inDmgMods &&
            props.inDmgMods.length > 0 &&
            props.inDmgMods.map((mod, i) => (
              <div
                key={`in-${i}`}
                className="bg-slate-900/50 border border-slate-800 rounded px-3 py-1.5 text-sm"
              >
                <span className="text-muted-foreground">
                  {DMG_MOD_LABELS[mod.t] ?? mod.t} resistance:{" "}
                </span>
                <span className={mod.v < 0 ? "text-blue-400" : "text-red-400"}>
                  {mod.v < 0
                    ? `${Math.round(Math.abs(mod.v) * 100)}%`
                    : `–${Math.round(mod.v * 100)}%`}
                </span>
              </div>
            ))}
          {props.outDmgMods &&
            props.outDmgMods.length > 0 &&
            props.outDmgMods.map((mod, i) => (
              <div
                key={`out-${i}`}
                className="bg-slate-900/50 border border-slate-800 rounded px-3 py-1.5 text-sm"
              >
                <span className="text-muted-foreground">
                  {DMG_MOD_LABELS[mod.t] ?? mod.t} damage:{" "}
                </span>
                <span className={mod.v > 0 ? "text-green-400" : "text-red-400"}>
                  {mod.v > 0
                    ? `+${Math.round(mod.v * 100)}%`
                    : `${Math.round(mod.v * 100)}%`}
                </span>
              </div>
            ))}
        </div>
      )}

      {props.baseClass && (
        <div>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-1">
            {resolveDict(dict, "ui.class")}
          </h2>
          <p className="text-sm">{resolveDict(dict, props.baseClass)}</p>
          {dict[`${props.baseClass}_description`] && (
            <p className="text-sm text-muted-foreground mt-1">
              {resolveDict(dict, `${props.baseClass}_description`)}
            </p>
          )}
        </div>
      )}

      {props.abilities?.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {resolveDict(dict, "ui.abilities")}
          </h2>
          <div className="space-y-2">
            {props.abilities.map((a) => (
              <AbilityRow
                key={a}
                sid={a}
                dict={dict}
                params={props.abilityParams?.[a]}
                focusCost={props.abilityCosts?.[a]}
              />
            ))}
          </div>
        </div>
      )}

      {props.passives?.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {resolveDict(dict, "ui.passives")}
          </h2>
          <div className="space-y-2">
            {props.passives.map((p) => (
              <AbilityRow
                key={p}
                sid={p}
                dict={dict}
                passive
                params={props.passiveParams?.[p]}
              />
            ))}
          </div>
        </div>
      )}

      {props.altAttacks?.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {resolveDict(dict, "ui.alt_attacks")}
          </h2>
          <div className="space-y-2">
            {props.altAttacks.map((a) => (
              <AbilityRow
                key={a}
                sid={a}
                dict={dict}
                params={props.abilityParams?.[a]}
              />
            ))}
          </div>
        </div>
      )}

      {upgradeChain.length > 1 && (
        <RelatedSection title={resolveDict(dict, "ui.upgrade_path")}>
          <div className="flex gap-2 flex-wrap">
            {upgradeChain.map((entry) => {
              if (!entry) return null;
              return (
                <EntityLinkCard
                  key={entry.item.id}
                  itemId={entry.item.id}
                  database={database}
                  locale={locale}
                  dict={dict}
                  iconsHash={iconsHash}
                  subtitle={
                    entry.item.id === baseId
                      ? resolveDict(dict, "ui.base")
                      : entry.item.id.endsWith("_upg_alt")
                        ? resolveDict(dict, "ui.alt_upgrade")
                        : resolveDict(dict, "ui.upgrade_label")
                  }
                />
              );
            })}
          </div>
        </RelatedSection>
      )}
    </div>
  );
}

function StatCell({
  label,
  value,
  color = "text-foreground",
  small = false,
  mechanicKey,
  locale,
}: {
  label: string;
  value: string | number;
  color?: string;
  small?: boolean;
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
      <div
        className={`${small ? "text-xs" : "text-lg"} font-semibold ${color} mt-0.5`}
      >
        {value}
      </div>
    </div>
  );
}

function AbilityRow({
  sid,
  dict,
  passive = false,
  params,
  focusCost,
}: {
  sid: string;
  dict: Record<string, string>;
  passive?: boolean;
  /** Numeric values for the ability/passive's description placeholders, in
   *  the order the game data stores them. Index N fills `{N}` in the
   *  description. Extracted from buffs + misc unit stats by the data-mining
   *  pipeline; missing slots fall back to `?`. */
  params?: number[];
  /** Focus Charges spent to activate this ability (active abilities only). */
  focusCost?: number;
}) {
  const name = resolveDict(dict, sid);
  const descCandidates = [
    `${sid}_desc`,
    `${sid.replace(/_name$/, "_name_desc")}`,
    `${sid.replace(/_name$/, "_description")}`,
  ];
  let desc: string | undefined;
  for (const key of descCandidates) {
    if (dict[key]) {
      desc = resolveDict(dict, key);
      break;
    }
  }
  if (desc) {
    desc = desc.replace(/\{(\d+)\}/g, (_, idx) => {
      const v = params?.[parseInt(idx, 10)];
      return v != null ? String(v) : "?";
    });
    desc = desc.replace(/<\/?[a-zA-Z][^>]*>/g, "");
  }

  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={passive ? "text-blue-400" : "text-amber-400"}>
          {passive ? "◇" : "◆"}
        </span>
        <span className="font-medium">{name}</span>
        {typeof focusCost === "number" && (
          <span className="ml-auto shrink-0 text-xs px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400 border border-amber-800/50">
            {focusCost} {resolveDict(dict, "ui.focus_cost")}
          </span>
        )}
      </div>
      {desc && (
        <p className="text-sm text-muted-foreground mt-1 ml-5 whitespace-pre-line">
          {desc}
        </p>
      )}
    </div>
  );
}
