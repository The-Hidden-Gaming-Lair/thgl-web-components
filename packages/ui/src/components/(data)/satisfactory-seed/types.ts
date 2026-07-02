// Types for the Satisfactory world-seed randomization port.
//
// SOURCE OF TRUTH: this module is validated byte-for-byte against Konsl's
// satisfactory-world-generator (Rust) via a differential oracle — see
// world-seed/README.md. Keep it a pure, dependency-free port so it can be
// mirrored verbatim into the frontend (packages/lib) where it runs client-side.

/** Resource descriptor class name, e.g. "Desc_OreIron_C" (== Konsl get_internal_name). */
export type ResourceDescriptor = string;

/** Purity as the game's raw FName (note the game's "RP_Inpure" typo for impure). */
export type Purity = "RP_Inpure" | "RP_Normal" | "RP_Pure";

export type Vector = [number, number, number];

export interface ResourceNode {
  name: string;
  location: Vector;
  resource: ResourceDescriptor;
  purity: Purity;
}

export interface GeyserNode {
  name: string;
  location: Vector;
  purity: Purity;
}

export interface FrackingSatellite {
  name: string;
  location: Vector;
  purity: Purity;
}

export interface FrackingCore {
  name: string;
  location: Vector;
  resource: ResourceDescriptor;
  satellites: FrackingSatellite[];
}

export interface World {
  gameVersion: string;
  resourceNodes: ResourceNode[];
  geysers: GeyserNode[];
  frackingCores: FrackingCore[];
}

export type RandomizationMode =
  | "none"
  | "strict"
  | "basic_rich"
  | "advanced_rich"
  | "fossil_fuel_rich";

export type PuritySettings =
  | "no_change"
  | "all_impure"
  | "decrease"
  | "all_normal"
  | "increase"
  | "all_pure"
  | "all_random";

// --- Descriptor tables (mirror game.rs) ---------------------------------------

/** All descriptors in declaration order (Konsl strum::EnumIter order). */
export const ALL_RESOURCES: ResourceDescriptor[] = [
  "Desc_OreIron_C",
  "Desc_Coal_C",
  "Desc_OreCopper_C",
  "Desc_Stone_C",
  "Desc_RawQuartz_C",
  "Desc_LiquidOil_C",
  "Desc_Water_C",
  "Desc_SAM_C",
  "Desc_NitrogenGas_C",
  "Desc_OreBauxite_C",
  "Desc_OreGold_C",
  "Desc_Sulfur_C",
  "Desc_OreUranium_C",
];

export type GameplayTag = "basic" | "advanced" | "fossil_fuel";

const TAG_MEMBERS: Record<GameplayTag, ReadonlySet<ResourceDescriptor>> = {
  basic: new Set([
    "Desc_OreIron_C",
    "Desc_Coal_C",
    "Desc_OreCopper_C",
    "Desc_Stone_C",
  ]),
  advanced: new Set([
    "Desc_RawQuartz_C",
    "Desc_SAM_C",
    "Desc_OreBauxite_C",
    "Desc_OreGold_C",
    "Desc_Sulfur_C",
    "Desc_OreUranium_C",
  ]),
  fossil_fuel: new Set(["Desc_Coal_C", "Desc_LiquidOil_C", "Desc_Sulfur_C"]),
};

export function hasTag(
  resource: ResourceDescriptor,
  tag: GameplayTag,
): boolean {
  return TAG_MEMBERS[tag].has(resource);
}

/** Purity ordinal value (ResourcePurity discriminant): Impure=1, Normal=2, Pure=4. */
export const PURITY_VALUE: Record<Purity, number> = {
  RP_Inpure: 1,
  RP_Normal: 2,
  RP_Pure: 4,
};
