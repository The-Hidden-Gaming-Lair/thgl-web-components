import { NextResponse } from "next/server";
import { fetchDatabaseIndex, fetchDatabaseType, fetchDict } from "@repo/lib";
import { getAppConfig } from "@/lib/get-app-config";

function resolveDict(dict: Record<string, string>, key: string): string {
  const value = dict[key];
  if (!value) return key;
  if (value[0] === "@") return dict[value] ?? value;
  return value;
}

function resolveBuffName(dict: Record<string, string>, key: string): string {
  if (dict[key])
    return dict[key].startsWith("@") ? resolveDict(dict, key) : dict[key];

  let m = key.match(
    /^skill_.+?_sub_skill_[a-z0-9_]+?_(warrior|mage|campaign|arena)_bonus$/,
  );
  if (m) return resolveDict(dict, `ui.variant_${m[1]}`);

  m = key.match(/^(sub_skill_[a-z0-9_]+?)_bonus$/);
  if (m && dict[m[1]]) return resolveDict(dict, m[1]);

  m = key.match(/^(sub_skill_[a-z0-9_]+?)_(offence|defence)$/);
  if (m && dict[m[1]]) {
    const sub = resolveDict(dict, m[1]);
    const side = resolveDict(dict, `ui.side_${m[2]}`);
    return `${sub} (${side})`;
  }

  m = key.match(/^skill_(.+)_(\d+)_bonus$/);
  if (m) {
    const candidate = `sub_skill_${m[1]}_${m[2]}`;
    if (dict[candidate]) return resolveDict(dict, candidate);
  }
  m = key.match(/^skill_([^_]+)_.*_bonus_(\d+)$/);
  if (m) {
    const candidate = `sub_skill_${m[1]}_${m[2]}`;
    if (dict[candidate]) return resolveDict(dict, candidate);
  }

  const tail = key.replace(
    /^skill_[^_]+(?:_[^_]+)*?_(?=(?:warrior|mage|campaign|arena|bonus|offence|defence))/i,
    "",
  );
  return humanizeStat(tail !== key ? tail : key);
}

function stripHtml(text: string): string {
  return text.replace(/<\/?[a-zA-Z][^>]*>/g, "");
}

function humanizeStat(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function formatValue(value: string | number): string {
  if (typeof value === "number") {
    if (value > 0 && value < 1) return `+${(value * 100).toFixed(0)}%`;
    if (value > 1 && value < 2) return `+${((value - 1) * 100).toFixed(0)}%`;
    return value > 0 ? `+${value}` : `${value}`;
  }
  const num = parseFloat(value);
  if (!isNaN(num)) {
    if (num > 0 && num < 1) return `+${(num * 100).toFixed(0)}%`;
    return num > 0 ? `+${num}` : `${num}`;
  }
  return value;
}

type Bonus = { type: string; params: (string | number)[] };

function formatBonus(
  bonus: Bonus,
  dict: Record<string, string>,
): string | null {
  const { type, params } = bonus;
  switch (type) {
    case "heroStatBattle":
    case "heroStat": {
      const statKey = params[0] as string;
      if (statKey === "magicSchoolSet") {
        const school = params[1] as string;
        const schoolName = resolveDict(dict, `ui.school_${school}`);
        const tier = Number(params[2]);
        const spellLevel = Number(params[3] ?? 0);
        const parts: string[] = [];
        if (tier > 0)
          parts.push(`Learn ${schoolName} spells (up to tier ${tier})`);
        if (spellLevel > 0)
          parts.push(`${schoolName} spells +${spellLevel} level`);
        if (spellLevel < 0)
          parts.push(`${schoolName} spells ${spellLevel} level`);
        return parts.length > 0 ? parts.join(", ") : `${schoolName} spells`;
      }
      if (statKey === "magicCostSchoolSet") {
        const school = params[1] as string;
        const schoolName = resolveDict(dict, `ui.school_${school}`);
        const cost = Number(params[2]);
        if (cost === 0) return `${schoolName} spell cost reduction`;
        return `${schoolName} spell cost: –${Math.round(cost * 100)}%`;
      }
      if (statKey === "magicCostSidSet") {
        const spellName = resolveDict(dict, params[1] as string);
        const cost = Number(params[2]);
        const sign = cost < 0 ? "–" : "+";
        return `${spellName} mana cost: ${sign}${Math.abs(cost)}`;
      }
      if (statKey === "spellPowerSchoolSet") {
        const school = params[1] as string;
        const schoolName = resolveDict(dict, `ui.school_${school}`);
        const value = Number(params[2]);
        return `${schoolName} Spell Power: ${value > 0 ? "+" : ""}${value}`;
      }
      if (statKey === "magicCounterSet") {
        const school = params[1] as string;
        const schoolName = resolveDict(dict, `ui.school_${school}`);
        return `Counters ${schoolName} magic`;
      }
      if (statKey === "heroResPercentSet") {
        const target = params[1] as string;
        const value = Number(params[2]);
        const label = target === "all" ? "All resources" : humanizeStat(target);
        return `${label}: ${value > 0 ? "+" : ""}${Math.round(value * 100)}%`;
      }
      if (statKey === "outDmgMultipliersSet") {
        const dmgType = humanizeStat(params[1] as string);
        const value = Number(params[3]);
        return `${dmgType}: ${value > 0 ? "+" : ""}${Math.round(value * 100)}%`;
      }
      if (statKey === "energyValuesSet") return null;
      if (statKey?.startsWith?.("enable")) return null;
      return `${humanizeStat(statKey)}: ${formatValue(params[1])}`;
    }
    case "unitStat": {
      if (params[0] === "modifierSet") {
        return `${humanizeStat(params[1] as string)} (${humanizeStat(params[2] as string)}): ${formatValue(params[3])}`;
      }
      return `Unit ${humanizeStat(params[0] as string)}: ${formatValue(params[1])}`;
    }
    case "battleSubskillBonus":
      return `${resolveDict(dict, "ui.battle_bonus")}: ${resolveBuffName(dict, params[1] as string)}`;
    case "heroBattleAbility":
      return `${resolveDict(dict, "ui.battle_ability")}: ${resolveDict(dict, params[0] as string)}`;
    case "heroWorldAbility":
      return `${resolveDict(dict, "ui.world_ability")}: ${resolveDict(dict, params[0] as string)}`;
    case "modifyMagic":
      return `${resolveDict(dict, "ui.modifies_spell")}: ${resolveDict(dict, params[0] as string)}`;
    case "addMagicToBook":
    case "heroMagicAddition":
      return `${resolveDict(dict, "ui.grants_spell")}: ${resolveDict(dict, params[0] as string)}`;
    case "heroMagicAdditionMass": {
      const school = params[0] as string;
      const tier = params[1];
      const count = params[2];
      const schoolLabel =
        school === "any" ? "" : ` ${resolveDict(dict, `ui.school_${school}`)}`;
      const tierLabel = tier === "any" ? "" : ` tier ${tier}`;
      return `Grants ${count}${schoolLabel}${tierLabel} spell(s)`;
    }
    case "heroActionBonusAddition":
      return null;
    case "heroStatMap":
      return `${humanizeStat(params[0] as string)} (map): ${formatValue(params[1])}`;
    case "sideRes":
      return `${humanizeStat(params[0] as string)}: +${params[1]}`;
    case "sideFactionRes":
      return `Faction resource: +${params[0]}`;
    case "heroExp":
      return params[0] === "true" ? "Bonus hero experience" : "Hero experience";
    case "astrologyExp":
      return `Astrology XP: +${params[0]}`;
    case "heroScouting":
      return `Scouting range: +${params[0]}`;
    case "restoreManaAfterBattle":
      return `Restores ${params[0]} mana after battle`;
    case "cityUnitsIncrement":
      return `Weekly city units: +${params[0]}/${params[1]}`;
    case "cityUnitsIncrementPerWhenHeroInCity":
      return `City units (in-city): +${Math.round(Number(params[1]) * 100)}%`;
    case "battleMechModBonus":
      return null;
    case "startBattleUnitsCountBonus":
    case "startBattleUnfrozenUnitCountBonus":
      return `Bonus units at battle start: +${Math.round(Number(params[1]) * 100)}%`;
    case "heroUnfrozenMovementRestoreBonus":
    case "heroUnfrozenBattleBonus":
      return `${humanizeStat(params[0] as string)}: ${formatValue(params[1])}`;
    default:
      return `${humanizeStat(type)}: ${params.map((p) => (typeof p === "string" ? humanizeStat(p) : formatValue(p))).join(", ")}`;
  }
}

export async function GET(request: Request) {
  // Resolve the app from the request host so the tooltip API serves any DB
  // tenant (Gothic, Drakantos, …), not just HoMM. HoMM's bespoke per-type stat
  // cases still apply when its entry types match; other games fall through to
  // the generic `default` case that surfaces their captured props.
  const appConfig = await getAppConfig();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const locale = searchParams.get("locale") || "en";

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const [index, dict] = await Promise.all([
    fetchDatabaseIndex(appConfig.name),
    fetchDict(appConfig.name, locale),
  ]);

  let item: any;
  let entryType = "";
  for (const cat of index) {
    if (cat.items.some((i: any) => i.id === id)) {
      entryType = cat.type;
      break;
    }
  }
  if (entryType) {
    const fullCat = await fetchDatabaseType(appConfig.name, entryType);
    item = fullCat.items.find((i: any) => i.id === id);
  }

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const dictKey = entryType === "factions" ? `faction_${id}` : id;
  const name = resolveDict(dict, dictKey);
  let desc = resolveDict(dict, `${dictKey}_desc`);
  let hasDesc = desc && desc !== `${dictKey}_desc` && desc !== name;

  if (hasDesc && desc.includes("{")) {
    // For entities that pre-computed `descParams` at extraction time (e.g.
    // sub-skills, which need a buff-reference chain to resolve), use that
    // array directly. Spells store per-mastery `levelParams[i]` instead —
    // use level 0 (None mastery) for the tooltip, matching the
    // "single representative value" convention.
    let alreadySubstituted = false;
    let numericValues: string[] = [];
    const pre = (item.props as any)?.descParams;
    const spellLevelParams = (item.props as any)?.levelParams?.[0];
    // Map objects ship the description's `{N}` values directly under
    // `templateValues` (e.g. `pile_of_books` has `templateValues: [25]`
    // for "+{0}% XP"). Used here on parity with `MapObjectView`.
    const templateValues = (item.props as any)?.templateValues;
    if (Array.isArray(pre) && pre.length > 0) {
      numericValues = pre.map((n: number) => String(n));
    } else if (Array.isArray(templateValues) && templateValues.length > 0) {
      numericValues = templateValues.map((v: any) => String(v));
    } else if (Array.isArray(spellLevelParams) && spellLevelParams.length > 0) {
      // Spells: `levelParams[0]` = `[duration, ...statValues]`. Mirror the
      // spell-view's `%`-aware substitution so descriptions like Radiant
      // Armor's "–{0}% Damage. Duration: {1} round(s)" fill correctly
      // (placeholder followed by `%` consumes stat values; non-`%` ones
      // get the duration).
      const duration = spellLevelParams[0];
      const statValues = spellLevelParams.slice(1) as number[];
      const statPlaceholders = new Set<number>();
      for (const m of desc.matchAll(/\{(\d+)\}%/g)) {
        statPlaceholders.add(parseInt(m[1], 10));
      }
      let statCursor = 0;
      desc = desc.replace(/\{(\d+)\}/g, (_, idx: string) => {
        const i = parseInt(idx, 10);
        if (statPlaceholders.has(i)) {
          const v = statValues[statCursor++];
          return v != null ? String(v) : "?";
        }
        return duration != null ? String(duration) : "?";
      });
      alreadySubstituted = true;
    } else {
      // Skills store bonuses per level (`levels[i].bonuses`), not on the top
      // `bonuses` array. Fall back to level 0 so e.g. `skill_luck`'s
      // "{0} Luck" resolves to the Basic-mastery value.
      const bonusSource =
        item.props?.bonuses ?? item.props?.levels?.[0]?.bonuses ?? [];
      for (const b of bonusSource) {
        for (const p of b.params ?? []) {
          const n = parseFloat(String(p));
          if (
            !isNaN(n) &&
            n !== 0 &&
            String(p) !== "true" &&
            String(p) !== "false"
          ) {
            const abs = Math.abs(n);
            numericValues.push(
              abs > 0 && abs < 1 ? `${Math.round(abs * 100)}` : String(abs),
            );
          }
        }
      }
    }
    if (!alreadySubstituted) {
      desc = desc.replace(
        /\{(\d+)\}/g,
        (_, idx: string) => numericValues[parseInt(idx)] ?? "?",
      );
    }
  }
  if (hasDesc) desc = stripHtml(desc);

  const bonuses: string[] = [];
  // Item sets store `bonuses` as `[{ requiredItems, desc, effects[] }, ...]`,
  // not as a flat list of `{type, params}` rows — so the generic formatter
  // produces noise. We handle them in the `item_sets` switch case below.
  if (entryType !== "item_sets") {
    for (const b of item.props?.bonuses ?? []) {
      const formatted = formatBonus(b, dict);
      if (formatted) bonuses.push(stripHtml(formatted));
    }
  }

  const extras: { label: string; value: string }[] = [];
  const stats: string[] = [];
  const p = item.props ?? {};
  switch (entryType) {
    case "units": {
      let base: any = null;
      if (p.baseId && p.upgradeLevel && p.upgradeLevel !== "base") {
        const fullCat = await fetchDatabaseType(appConfig.name, "units");
        base = fullCat.items.find((i: any) => i.id === p.baseId)?.props ?? null;
      }
      const fmtStat = (
        label: string,
        value: number,
        baseValue?: number,
      ): string => {
        if (typeof baseValue === "number" && baseValue !== value) {
          const delta = value - baseValue;
          const sign = delta > 0 ? "+" : "";
          return `${label}: ${value} (${sign}${delta})`;
        }
        return `${label}: ${value}`;
      };
      if (p.tier) stats.push(`Tier ${p.tier}`);
      if (p.hp != null) stats.push(fmtStat("HP", p.hp, base?.hp));
      if (p.offence != null)
        stats.push(fmtStat("ATK", p.offence, base?.offence));
      if (p.defence != null)
        stats.push(fmtStat("DEF", p.defence, base?.defence));
      if (p.damageMin != null && p.damageMax != null) {
        const dmg = `${p.damageMin}–${p.damageMax}`;
        if (
          base &&
          (base.damageMin !== p.damageMin || base.damageMax !== p.damageMax)
        ) {
          const dMin = p.damageMin - base.damageMin;
          const dMax = p.damageMax - base.damageMax;
          const sMin = dMin > 0 ? "+" : "";
          const sMax = dMax > 0 ? "+" : "";
          stats.push(`DMG: ${dmg} (${sMin}${dMin}/${sMax}${dMax})`);
        } else {
          stats.push(`DMG: ${dmg}`);
        }
      }
      if (p.initiative != null)
        stats.push(fmtStat("INI", p.initiative, base?.initiative));
      if (p.speed != null) stats.push(fmtStat("SPD", p.speed, base?.speed));
      // Variant-shaped units (Songs of Conquest): stats live in
      // `_unit.variants[0].stats` as label→value pairs, not top-level props.
      // Surface a curated subset of the base variant's combat stats.
      const variant = (p as any)._unit?.variants?.[0];
      if (stats.length === 0 && Array.isArray(variant?.stats)) {
        const want = [
          "Tier",
          "Damage",
          "Health",
          "Melee Offence",
          "Ranged Offence",
          "Defence",
          "Movement",
        ];
        const byLabel = new Map<string, string>(
          variant.stats.map((s: any) => [s.label, String(s.value)]),
        );
        for (const label of want) {
          const v = byLabel.get(label);
          if (v != null)
            stats.push(label === "Tier" ? `Tier ${v}` : `${label}: ${v}`);
        }
      }
      break;
    }
    case "heroes": {
      const faction = p.faction
        ? resolveDict(dict, `faction_${p.faction}`)
        : null;
      if (faction && faction !== `faction_${p.faction}`) stats.push(faction);
      if (p.classType) stats.push(p.classType === "might" ? "Might" : "Magic");
      if (p.offence) stats.push(`ATK: ${p.offence}`);
      if (p.defence) stats.push(`DEF: ${p.defence}`);
      if (p.spellPower) stats.push(`SP: ${p.spellPower}`);
      if (p.intelligence) stats.push(`INT: ${p.intelligence}`);

      // For drafting / quick comparison, the hero's specialization is the
      // single most useful piece of info — much more so than the backstory.
      // We replace the flavor `desc` with `"{specName}: {specDesc}"` (with
      // `{0}/{1}` placeholders filled from the specialization's own bonus
      // params, mirroring the inline display on the hero detail page).
      if (p.specialization) {
        const specName = resolveDict(dict, p.specialization as string);
        const baseId = (p.specialization as string).replace(
          "_specialization",
          "",
        );
        // Prefer `<sid>_specialization_desc` over the short `_spec_desc`.
        // The two can disagree (e.g. Merry Elias's `_spec_desc` says
        // "Spellbook one more time per battle round" but the actual
        // mechanic — captured by `_specialization_desc` — is +1 global-map
        // spell cap). `_specialization_desc` is the authoritative text on
        // the specialization detail page, so we use that here too.
        const specializationDescKey = `${p.specialization}_desc`;
        const shortDescKey = `${baseId}_spec_desc`;
        const fullDesc = resolveDict(dict, specializationDescKey);
        const rawSpecDesc =
          fullDesc && fullDesc !== specializationDescKey
            ? fullDesc
            : resolveDict(dict, shortDescKey);
        const hasSpecDesc =
          rawSpecDesc &&
          rawSpecDesc !== shortDescKey &&
          rawSpecDesc !== specializationDescKey;
        if (specName !== p.specialization && hasSpecDesc) {
          const specsCat = await fetchDatabaseType(
            appConfig.name,
            "specializations",
          );
          const specEntry = specsCat.items.find(
            (i: any) => i.id === p.specialization,
          );
          // Prefer the authoritative tooltip-script values resolved at
          // extraction time (level steps / script literals the bonus-param
          // scan can't see — otherwise Dhüvri reads "every 1 hero level").
          const specPre = (specEntry?.props as any)?.descParams as
            | number[]
            | undefined;
          const values: string[] = [];
          if (Array.isArray(specPre) && specPre.length > 0) {
            values.push(...specPre.map((n) => String(n)));
          } else {
            const specBonuses = ((specEntry?.props as any)?.bonuses ?? []) as {
              params?: (string | number)[];
              upgrade?: { increment: number; levelStep?: number };
            }[];
            for (const b of specBonuses) {
              for (const param of b.params ?? []) {
                const n = parseFloat(String(param));
                if (
                  !isNaN(n) &&
                  n !== 0 &&
                  String(param) !== "true" &&
                  String(param) !== "false"
                ) {
                  const abs = Math.abs(n);
                  values.push(
                    abs > 0 && abs < 1
                      ? `${Math.round(abs * 100)}`
                      : String(abs),
                  );
                }
              }
              if (b.upgrade) {
                const inc = b.upgrade.increment;
                if (inc !== 0) {
                  const abs = Math.abs(inc);
                  values.push(
                    abs > 0 && abs < 1
                      ? `${Math.round(abs * 100)}`
                      : String(abs),
                  );
                }
                if (b.upgrade.levelStep)
                  values.push(String(b.upgrade.levelStep));
              }
            }
          }
          const filled = stripHtml(rawSpecDesc).replace(
            /\{(\d+)\}/g,
            (_, idx: string) => values[parseInt(idx)] ?? "?",
          );
          desc = `${specName}: ${filled}`;
          hasDesc = true;
        } else if (specName !== p.specialization) {
          // Spec name resolved but no description — keep the spec as an extra.
          extras.push({ label: "Specialization", value: specName });
        }
      }
      if (Array.isArray(p.startSkills) && p.startSkills.length > 0) {
        const names = (p.startSkills as string[])
          .map((s) => resolveDict(dict, s))
          .filter((n, i) => n !== (p.startSkills as string[])[i]);
        if (names.length > 0)
          extras.push({ label: "Starting Skills", value: names.join(", ") });
      }
      if (Array.isArray(p.startingArmy) && p.startingArmy.length > 0) {
        const army = (
          p.startingArmy as { unit: string; min: number; max: number }[]
        )
          .map((a) => `${a.min}–${a.max} ${resolveDict(dict, a.unit)}`)
          .join(", ");
        extras.push({ label: "Starting Army", value: army });
      }
      break;
    }
    case "spells": {
      if (p.school) {
        const schoolName = resolveDict(dict, `ui.school_${p.school}`);
        stats.push(
          schoolName !== `ui.school_${p.school}`
            ? schoolName
            : humanizeStat(p.school as string),
        );
      }
      if (p.tier) stats.push(`Tier ${p.tier}`);
      if (p.manaCost) stats.push(`${p.manaCost} Mana`);
      break;
    }
    case "items": {
      if (p.slot) {
        const slotKey = `ui.slot_${p.slot}`;
        const resolved = resolveDict(dict, slotKey);
        stats.push(
          resolved !== slotKey
            ? resolved
            : (p.slot as string)
                .replace(/_slot$/, "")
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase()),
        );
      }
      if (p.rarity) stats.push(humanizeStat(p.rarity as string));
      break;
    }
    case "item_sets": {
      // `bonuses` is the per-tier set-bonus table. Render each tier as
      // "<N pieces>: <description>" with the description's `{0}/{1}`
      // placeholders filled from that tier's own effect params.
      const setBonuses = (p.bonuses ?? []) as {
        requiredItems?: string | number;
        desc?: string;
        effects?: { type: string; params: (string | number)[] }[];
      }[];
      for (const tier of setBonuses) {
        if (!tier.desc) continue;
        const raw = resolveDict(dict, tier.desc);
        if (raw === tier.desc) continue; // sid didn't resolve
        const values: string[] = [];
        for (const eff of tier.effects ?? []) {
          for (const param of eff.params ?? []) {
            const n = parseFloat(String(param));
            if (
              !isNaN(n) &&
              n !== 0 &&
              String(param) !== "true" &&
              String(param) !== "false"
            ) {
              const abs = Math.abs(n);
              values.push(
                abs > 0 && abs < 1 ? `${Math.round(abs * 100)}` : String(abs),
              );
            }
          }
        }
        const filled = stripHtml(raw).replace(
          /\{(\d+)\}/g,
          (_, idx: string) => values[parseInt(idx)] ?? "?",
        );
        const n = Number(tier.requiredItems);
        const count =
          tier.requiredItems != null
            ? `${tier.requiredItems} ${n === 1 ? "piece" : "pieces"}`
            : "Set";
        bonuses.push(`${count}: ${filled}`);
      }
      const memberCount = Array.isArray(p.itemsInSet) ? p.itemsInSet.length : 0;
      if (memberCount > 0) {
        stats.push(`${memberCount} items`);
      }
      break;
    }
    case "skills":
    case "sub_skills": {
      if (p.skillType) stats.push(humanizeStat(p.skillType as string));
      break;
    }
    case "buildings": {
      if (p.costGold) stats.push(`${p.costGold} Gold`);
      break;
    }
    case "specializations": {
      if (item.groupId) {
        const factionName = resolveDict(dict, `faction_${item.groupId}`);
        if (factionName !== `faction_${item.groupId}`) stats.push(factionName);
      }
      break;
    }
    default: {
      // Generic games (e.g. Gothic 1 Remake) describe each item purely through
      // its captured `props` (Damage, Value, Class, …). Surface those scalar
      // props as stat badges. `Category` is redundant with the section, so it's
      // only used as a last-resort label to keep the tooltip non-empty.
      for (const [k, v] of Object.entries(p)) {
        if (k === "Category") continue;
        if (typeof v === "string" || typeof v === "number") {
          stats.push(`${k}: ${v}`);
        }
      }
      if (stats.length === 0 && !hasDesc && typeof p.Category === "string") {
        stats.push(p.Category);
      }
      break;
    }
  }

  // Fallback for tenants whose props are already display-ready label→value
  // pairs (e.g. Songs of Conquest) and whose entry type collided with a
  // bespoke HoMM case above that produced nothing. Surface scalar props as
  // stat badges (short) / bonus lines (long, e.g. trait effects) so every
  // entry gets a useful tooltip. Skipped when a bespoke case already filled in.
  if (stats.length === 0 && bonuses.length === 0 && extras.length === 0) {
    for (const [k, v] of Object.entries(p)) {
      if (k.startsWith("_") || k === "Category") continue;
      if (typeof v === "string" || typeof v === "number") {
        if (typeof v === "string" && v.length > 24) bonuses.push(`${k}: ${v}`);
        else stats.push(`${k}: ${v}`);
      }
    }
  }

  return NextResponse.json(
    {
      id,
      name,
      type: entryType,
      desc: hasDesc ? desc : null,
      bonuses,
      stats,
      extras,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
