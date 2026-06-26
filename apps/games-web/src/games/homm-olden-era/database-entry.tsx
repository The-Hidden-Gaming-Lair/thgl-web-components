import { notFound } from "next/navigation";
import {
  fetchDatabaseIndex,
  fetchDatabaseType,
  fetchDict,
  fetchVersion,
  type DatabaseConfig,
} from "@repo/lib";
import { JSONLDScript } from "@repo/ui/apps";
import { resolveDict } from "@/lib/db/resolve-dict";
import { entityPageJsonLd } from "@/lib/db/json-ld";
import { hommOldenEra } from "@/configs/homm-olden-era";
import { UnitView } from "@/games/homm-olden-era/entity-views/unit-view";
import { HeroView } from "@/games/homm-olden-era/entity-views/hero-view";
import { SpellView } from "@/games/homm-olden-era/entity-views/spell-view";
import { ItemView } from "@/games/homm-olden-era/entity-views/item-view";
import { SkillView } from "@/games/homm-olden-era/entity-views/skill-view";
import { FactionView } from "@/games/homm-olden-era/entity-views/faction-view";
import { BuildingView } from "@/games/homm-olden-era/entity-views/building-view";
import { MapObjectView } from "@/games/homm-olden-era/entity-views/map-object-view";
import { MapView } from "@/games/homm-olden-era/entity-views/map-view";

const APP_NAME = "homm-olden-era";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function collectKeys(
  dict: Record<string, string>,
  props: Record<string, any>,
  id: string,
  entryType: string,
): Set<string> {
  const keys = new Set<string>();

  const dictKey = entryType === "factions" ? `faction_${id}` : id;
  keys.add(dictKey);
  keys.add(`${dictKey}_desc`);
  keys.add(`${dictKey}_description`);
  keys.add(`${dictKey}_narrative`);

  for (const k of Object.keys(dict)) {
    if (k.startsWith("ui.")) keys.add(k);
  }

  for (const k of [
    "units",
    "heroes",
    "spells",
    "items",
    "item_sets",
    "skills",
    "factions",
    "specializations",
    "faction_laws",
    "sub_skills",
    "buildings",
    "map_objects",
  ]) {
    keys.add(k);
  }

  if (
    entryType === "units" ||
    entryType === "heroes" ||
    entryType === "buildings"
  ) {
    for (const r of [
      "gold",
      "wood",
      "ore",
      "dust",
      "crystals",
      "gemstones",
      "mercury",
    ]) {
      keys.add(`resource_${r}`);
    }
  }

  if (entryType === "heroes" && typeof props.specialization === "string") {
    const baseId = (props.specialization as string).replace(
      "_specialization",
      "",
    );
    keys.add(`${baseId}_spec`);
    keys.add(`${baseId}_spec_desc`);
  }

  function walk(val: any) {
    if (typeof val === "string") {
      keys.add(val);
      keys.add(`${val}_desc`);
      keys.add(`${val}_description`);
      keys.add(`faction_${val}`);
      // For ability/passive sids that end in `_name`, also keep the parallel
      // `_description` sid (e.g. `hive_queen_ability_2_name` →
      // `hive_queen_ability_2_description`). That's where the actual text
      // with `{N}` placeholders lives.
      if (val.endsWith("_name")) {
        keys.add(val.replace(/_name$/, "_description"));
        keys.add(val.replace(/_name$/, "_name_desc"));
      }
    } else if (Array.isArray(val)) {
      for (const v of val) walk(v);
    } else if (val && typeof val === "object") {
      for (const v of Object.values(val)) walk(v);
    }
  }
  walk(props);

  if (props.baseId) {
    for (const suffix of ["", "_upg", "_upg_alt"]) {
      const uid = `${props.baseId}${suffix}`;
      keys.add(uid);
      keys.add(`${uid}_desc`);
    }
  }

  if (
    (entryType === "skills" || entryType === "sub_skills") &&
    Array.isArray(props.levels)
  ) {
    for (const lvl of props.levels) {
      const level = lvl?.level;
      if (typeof level === "number") {
        keys.add(`${id}_level_${level}`);
        keys.add(`${id}_level_${level}_desc`);
      }
    }
  }

  return keys;
}

function sliceDict(
  dict: Record<string, string>,
  keys: Set<string>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of keys) {
    const value = dict[key];
    if (value !== undefined) {
      result[key] = value;
      if (value.startsWith("@") && dict[value]) {
        result[value] = dict[value];
      }
    }
  }
  return result;
}

export async function DatabaseEntryContent({
  id,
  typePrefix,
  locale = "en",
}: {
  id?: string;
  typePrefix: string;
  locale?: string;
}) {
  const [index, dict, version] = await Promise.all([
    fetchDatabaseIndex(APP_NAME),
    fetchDict(APP_NAME, locale),
    fetchVersion(APP_NAME),
  ]);
  const iconsHash = version.more.icons;

  let entryType: string = typePrefix;
  if (id) {
    const matchingType = index.find((cat) =>
      cat.items.some((i) => i.id === id),
    )?.type;
    if (!matchingType) notFound();
    entryType = matchingType;
  }

  const needsBuildings = entryType === "factions";
  const needsSpecializations = entryType === "heroes";
  const needsSkills = entryType === "sub_skills";
  const [entryCat, buildingsCat, specializationsCat, skillsCat] =
    await Promise.all([
      fetchDatabaseType(APP_NAME, entryType),
      needsBuildings
        ? fetchDatabaseType(APP_NAME, "buildings")
        : Promise.resolve(null),
      needsSpecializations
        ? fetchDatabaseType(APP_NAME, "specializations")
        : Promise.resolve(null),
      needsSkills
        ? fetchDatabaseType(APP_NAME, "skills")
        : Promise.resolve(null),
    ]);

  let item: DatabaseConfig[number]["items"][number] | undefined;
  if (id) {
    item = entryCat.items.find((i) => i.id === id);
  } else {
    item = entryCat.items[0];
  }
  if (!item) notFound();

  const database: DatabaseConfig = buildingsCat
    ? [...index.filter((cat) => cat.type !== "buildings"), buildingsCat]
    : index;

  const dictKey = entryType === "factions" ? `faction_${item.id}` : item.id;
  const name = resolveDict(dict, dictKey);
  const desc = resolveDict(dict, `${dictKey}_desc`);
  const icon = item.icon as IconSprite | undefined;
  const props = item.props as any;

  const liteDatabase = database.map((cat) => ({
    type: cat.type,
    items: cat.items.map((i) => {
      if (
        entryType === "factions" &&
        cat.type === "buildings" &&
        (i.props as any)?.faction === item.id
      ) {
        const lvls = ((i.props as any).levels ?? []).map((lvl: any) => ({
          name: lvl.name,
          icon: lvl.icon,
          costs: lvl.costs,
          prerequisites: lvl.prerequisites,
          nodePos: lvl.nodePos,
        }));
        return {
          id: i.id,
          icon: i.icon,
          groupId: i.groupId,
          props: {
            faction: (i.props as any).faction,
            category: (i.props as any).category,
            sid: (i.props as any).sid,
            levels: lvls,
          },
        };
      }
      if (
        entryType === "heroes" &&
        cat.type === "specializations" &&
        specializationsCat &&
        i.id === (item.props as any)?.specialization
      ) {
        const specFull = specializationsCat.items.find((s) => s.id === i.id);
        return {
          id: i.id,
          icon: i.icon,
          groupId: i.groupId,
          props: {
            bonuses: (specFull?.props as any)?.bonuses ?? [],
            descParams: (specFull?.props as any)?.descParams,
          },
        };
      }
      return {
        id: i.id,
        icon: i.icon,
        groupId: i.groupId,
        itemSet: i.props?.itemSet,
        ...(cat.type === "factions" && i.props?.ultimateSkills
          ? { props: { ultimateSkills: i.props.ultimateSkills } }
          : {}),
        // Faction page renders its laws grouped by tier with a per-law point
        // cost subtitle. The popup data still comes from the tooltip API, but
        // the cheap `unlockCost` is needed inline, so pass it through (only
        // when viewing a faction — keeps every other page's payload lean).
        ...(entryType === "factions" &&
        cat.type === "faction_laws" &&
        typeof (i.props as any)?.unlockCost === "number"
          ? { props: { unlockCost: (i.props as any).unlockCost } }
          : {}),
      };
    }),
  }));

  const neededKeys = collectKeys(dict, props, item.id, entryType);
  for (const cat of database) {
    for (const i of cat.items) {
      neededKeys.add(i.id);
      if (cat.type === "factions") {
        neededKeys.add(`faction_${i.id}`);
        for (const ult of (i.props as any)?.ultimateSkills ?? []) {
          neededKeys.add(ult.id);
          neededKeys.add(`${ult.id}_desc`);
        }
      }
    }
  }

  if (entryType === "factions") {
    for (const cat of database) {
      if (cat.type !== "buildings") continue;
      for (const i of cat.items) {
        if ((i.props as any)?.faction !== item.id) continue;
        neededKeys.add(i.id);
        for (const lvl of (i.props as any).levels ?? []) {
          if (lvl.name) neededKeys.add(lvl.name);
        }
      }
    }
    neededKeys.add("ui.cat_mains");
    neededKeys.add("ui.cat_taverns");
    neededKeys.add("ui.cat_markets");
    neededKeys.add("ui.cat_artifactMarkets");
    neededKeys.add("ui.cat_hires");
    neededKeys.add("ui.cat_magicGuilds");
    neededKeys.add("ui.cat_banks");
    neededKeys.add("ui.cat_walls");
    neededKeys.add("ui.cat_intelligences");
    neededKeys.add("ui.cat_trainingRanges");
    neededKeys.add("ui.cat_graals");
    neededKeys.add("ui.building_costs");
    neededKeys.add("ui.building_requires");
  }
  let parentSkill: { id: string; level: number } | null = null;
  if (entryType === "sub_skills" && skillsCat) {
    for (const skill of skillsCat.items) {
      const levels = ((skill.props as any)?.levels ?? []) as {
        level: number;
        subSkills?: string[];
      }[];
      for (const lvl of levels) {
        if (lvl.subSkills?.includes(item.id)) {
          parentSkill = { id: skill.id, level: lvl.level };
          break;
        }
      }
      if (parentSkill) break;
    }
    if (parentSkill) {
      neededKeys.add(parentSkill.id);
      neededKeys.add(`${parentSkill.id}_level_${parentSkill.level}`);
    }
  }
  // Reverse skill compatibility ("Compatible from"): scan every OTHER skill's
  // `props.compatibleWith` for entries whose `id` is the current skill, and
  // surface those source skills + the sub-skill(s) that target this one. Must
  // be computed here (full props available) — the lite database strips props.
  let compatibleFrom: { id: string; via: string[] }[] = [];
  if (entryType === "skills") {
    for (const skill of entryCat.items) {
      if (skill.id === item.id) continue;
      const cw = ((skill.props as any)?.compatibleWith ?? []) as {
        id: string;
        via?: string[];
      }[];
      for (const entry of cw) {
        if (entry.id === item.id) {
          compatibleFrom.push({ id: skill.id, via: entry.via ?? [] });
        }
      }
    }
    for (const cf of compatibleFrom) {
      neededKeys.add(cf.id);
      for (const sub of cf.via) neededKeys.add(sub);
    }
  }

  const slicedDict = sliceDict(dict, neededKeys);

  const viewProps = {
    name,
    desc,
    icon,
    props,
    dict: slicedDict,
    database: liteDatabase,
    locale,
    entryId: item.id,
    iconsHash,
  };

  // Section segment for the public URL — drives JSON-LD `url` and is
  // independent of the internal database type (e.g. items/item_sets both
  // live under /db/artifacts/<id>).
  const SECTION_BY_TYPE: Record<string, string> = {
    units: "units",
    heroes: "heroes",
    spells: "spells",
    items: "artifacts",
    item_sets: "artifacts",
    skills: "skills",
    sub_skills: "skills",
    factions: "factions",
    specializations: "factions",
    faction_laws: "factions",
    buildings: "buildings",
    map_objects: "map-objects",
    maps: "maps",
  };
  const sectionSegment = SECTION_BY_TYPE[entryType] ?? entryType;
  const sectionLabel = resolveDict(dict, sectionSegment);

  return (
    <>
      <JSONLDScript
        json={entityPageJsonLd({
          appConfig: hommOldenEra,
          section: sectionSegment,
          sectionLabel,
          entityId: item.id,
          entityName: name,
          description: desc !== `${dictKey}_desc` ? desc : undefined,
          locale,
        })}
      />
      <div className="py-4 text-left">
        {entryType === "units" && <UnitView {...viewProps} />}
        {entryType === "heroes" && <HeroView {...viewProps} />}
        {entryType === "spells" && <SpellView {...viewProps} />}
        {(entryType === "items" || entryType === "item_sets") && (
          <ItemView {...viewProps} />
        )}
        {(entryType === "skills" || entryType === "sub_skills") && (
          <SkillView
            {...viewProps}
            isSubSkill={entryType === "sub_skills"}
            parentSkill={parentSkill}
            compatibleFrom={compatibleFrom}
          />
        )}
        {(entryType === "factions" || entryType === "specializations") && (
          <FactionView {...viewProps} />
        )}
        {entryType === "faction_laws" && (
          <FactionView {...viewProps} isFactionLaw />
        )}
        {entryType === "buildings" && <BuildingView {...viewProps} />}
        {entryType === "map_objects" && <MapObjectView {...viewProps} />}
        {entryType === "maps" && <MapView {...viewProps} />}
      </div>
    </>
  );
}
