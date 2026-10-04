import {
  encodeMapFilterParam,
  fetchDatabaseIndex,
  fetchXpConfig,
  getDbSectionByType,
  hasCraftingTool,
  interpolate,
  translate,
  trainableSkills,
  type AppConfig,
  type Version,
  type XpConfig,
  type XpMethod,
} from "@repo/lib";
import { resolveDict } from "@/lib/db/resolve-dict";

/**
 * Skill XP planner data for the current tenant: the game's `config/xp.json`
 * (null → the pages 404) plus everything localized the UI shows. Names come
 * from the codex dict (recipes, items) or the file's own `terms` (building
 * pieces, nodes, spells…); icons from the codex index, else the map filter.
 */
export async function loadXpPlanner(
  appConfig: AppConfig,
): Promise<XpConfig | null> {
  const config = await fetchXpConfig(appConfig.name);
  if (!config || trainableSkills(config).length === 0) return null;
  return config;
}

export type XpIcon = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** One method as the client renders it (paths NOT locale-prefixed). */
export type XpMethodView = Omit<XpMethod, "name" | "db" | "map"> & {
  name: string;
  icon?: XpIcon;
  db?: string;
  map?: string;
};

export type XpPayload = {
  curve: number[];
  skills: { id: string; name: string }[];
  methods: XpMethodView[];
  /** The tenant ships the crafting calculator (`/api/db/crafting`) → costs. */
  crafting: boolean;
  iconsHash?: string;
};

/** game dict + the xp file's own terms for the locale (en as fallback). */
export function xpDict(
  config: XpConfig,
  dict: Record<string, string>,
  locale: string,
): Record<string, string> {
  return {
    ...(config.terms?.en ?? {}),
    ...(config.terms?.[locale] ?? {}),
    ...dict,
  };
}

/** The localized display name of a skill. */
export function skillName(
  config: XpConfig,
  dict: Record<string, string>,
  skillId: string,
): string {
  const skill = config.skills.find((s) => s.id === skillId);
  return skill ? resolveDict(dict, skill.name) : skillId;
}

/** Method name incl. its variant ("Anima Vent (concentrated)", "Oak Tree – felling"). */
export function methodLabel(
  method: Pick<XpMethod, "name" | "variant">,
  dict: Record<string, string>,
): string {
  const base = resolveDict(dict, method.name);
  if (!method.variant) return base;
  const variant = dict[`xp.variant.${method.variant}`];
  return variant
    ? interpolate(dict["xp.withVariant"] ?? "{{name}} ({{variant}})", {
        name: base,
        variant,
      })
    : base;
}

/** Resolve names, icons, codex + map links of every method for one locale. */
export async function xpPayload(
  appConfig: AppConfig,
  config: XpConfig,
  dict: Record<string, string>,
  version: Version,
): Promise<XpPayload> {
  const index = await fetchDatabaseIndex(appConfig.name).catch(() => []);
  const icons = new Map<string, XpIcon>();
  const typeOf = new Map<string, string>();
  for (const cat of index) {
    if (cat.type.startsWith("_")) continue;
    for (const item of cat.items) {
      typeOf.set(item.id, cat.type);
      if (item.icon && typeof item.icon === "object") {
        icons.set(`${cat.type}/${item.id}`, item.icon as XpIcon);
      }
    }
  }
  const slugByType = getDbSectionByType(appConfig.db?.homeSections, index);
  const filters = version.data.filters;
  const filterIcons = new Map<string, XpIcon>();
  for (const f of filters) {
    for (const v of f.values) {
      if (v.icon && typeof v.icon === "object") {
        filterIcons.set(v.id, v.icon as XpIcon);
      }
    }
  }
  const tileNames = Object.keys(version.data.tiles ?? {});
  const singleMap =
    tileNames.length === 1
      ? version.data.tiles[tileNames[0]]?.defaultTitle ||
        translate(dict, tileNames[0])
      : null;
  const counts = version.counts?.byType;

  const methods: XpMethodView[] = config.methods.map((m) => {
    const { name: _name, db, map, ...rest } = m;
    void _name;
    const slug = db ? slugByType.get(db.section) : undefined;
    // Map links only for filter types that have markers.
    const types = (map ?? []).filter((t) => !counts || (counts[t] ?? 0) > 0);
    let mapHref: string | undefined;
    if (types.length) {
      const param = singleMap ? encodeMapFilterParam(filters, types) : null;
      mapHref =
        singleMap && param
          ? `/maps/${encodeURIComponent(singleMap)}?filters=${encodeURIComponent(param)}`
          : `/guides/${encodeURIComponent(translate(dict, types[0]))}`;
    }
    return {
      ...rest,
      name: methodLabel(m, dict),
      icon:
        (db ? icons.get(`${db.section}/${db.id}`) : undefined) ??
        types.map((t) => filterIcons.get(t)).find(Boolean),
      db: db && slug ? `/db/${slug}/${encodeURIComponent(db.id)}` : undefined,
      map: mapHref,
    };
  });

  return {
    curve: config.curve,
    skills: trainableSkills(config).map((s) => ({
      id: s.id,
      name: resolveDict(dict, s.name),
    })),
    methods,
    crafting: hasCraftingTool(appConfig),
    iconsHash: version.more.icons,
  };
}

/** The `xp.*` UI strings of a locale (sent to client components). */
export function xpLabels(dict: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(dict).filter(
      ([k]) => k.startsWith("xp.") || k.startsWith("crafting."),
    ),
  );
}
