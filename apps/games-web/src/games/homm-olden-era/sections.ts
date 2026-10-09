/**
 * Section → entry-type mapping for HoMM Olden Era's /db pages.
 *
 * Each section is a URL segment (e.g. /db/units). The `types` are the
 * database entry types fed to EntityGrid / sidebar builders.
 *
 * Sections with bespoke layouts (skills, artifacts, mechanics) live as their
 * own route folders — they aren't listed here.
 */
/**
 * Database entry type → /db URL segment, for cross-links and search results.
 * Covers the bespoke routes too (items + item_sets → /db/artifacts,
 * sub_skills → /db/skills). db-index-routes.test.ts checks every type of the
 * database index resolves to a real route.
 */
export const TYPE_SECTION: Record<string, string> = {
  units: "units",
  heroes: "heroes",
  spells: "spells",
  items: "artifacts",
  item_sets: "artifacts",
  skills: "skills",
  sub_skills: "skills",
  specializations: "factions",
  factions: "factions",
  faction_laws: "factions",
  buildings: "buildings",
  map_objects: "map-objects",
};

export type Section = {
  /** URL segment under /db/ */
  section: string;
  /** Database entry types that belong to this section */
  types: string[];
  /** Dict key used to label the section (e.g. "units", "factions") */
  sectionDictKey: string;
  /** Prefix used to look up group labels in dict (e.g. "faction_" → faction_humans) */
  groupLabelPrefix: string;
  /** When true, group headers link to /db/<section>/<groupId> */
  linkGroups?: boolean;
  /** Alternate group path target (e.g. buildings group links to factions page) */
  groupSection?: string;
  /** Per-type name dict-key prefix (e.g. {factions: "faction_"}) */
  nameLabelPrefixByType?: Record<string, string>;
  /** Override name label prefix for the grid (e.g. "faction_") */
  nameLabelPrefix?: string;
  /** Override section label shown in metadata/breadcrumb */
  labelOverride?: string;
  /** Generated metadata category overrides the dict label */
  metadataLabelOverride?: string;
};

export const SECTIONS: Record<string, Section> = {
  units: {
    section: "units",
    types: ["units"],
    sectionDictKey: "units",
    groupLabelPrefix: "faction_",
    linkGroups: true,
  },
  heroes: {
    section: "heroes",
    types: ["heroes"],
    sectionDictKey: "heroes",
    groupLabelPrefix: "faction_",
    linkGroups: true,
  },
  spells: {
    section: "spells",
    types: ["spells"],
    sectionDictKey: "spells",
    groupLabelPrefix: "ui.school_",
    linkGroups: true,
  },
  buildings: {
    section: "buildings",
    types: ["buildings"],
    sectionDictKey: "buildings",
    groupLabelPrefix: "faction_",
    linkGroups: true,
    groupSection: "factions",
  },
  "map-objects": {
    section: "map-objects",
    types: ["map_objects"],
    sectionDictKey: "map_objects",
    groupLabelPrefix: "",
    linkGroups: true,
  },
  factions: {
    section: "factions",
    types: ["factions", "specializations", "faction_laws"],
    sectionDictKey: "factions",
    groupLabelPrefix: "",
    nameLabelPrefixByType: { factions: "faction_" },
  },
};
