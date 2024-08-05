// https://app.quicktype.io/?l=ts

export type Map = {
  __attr: {
    catalog_archetypes: {
      __fref: string;
    };
    details: {
      __fref: string;
    };
    preplaced_named_objects: {
      __fref: string;
    };
    terrain: {
      __fref: string;
    };
  };
  catalog_archetypes: string;
  catalogs: Array<string>;
  details: string;
  gameplay_level_name: string;
  level_script_location: string;
  managed_archetypes_path: string;
  preplaced_named_objects: string;
  terrain: string;
};

export type Details = {
  dimensions: Array<number>;
  description: string;
  map_name: string;
  map_tags: Array<string>;
  game_mode: string;
  tile_set_id: string;
  visibility: string;
  water_table_id: string;
  data_format_version: number;
};

export type Terrain = {
  terrainLevel: number;
  terrain_nodes: Array<number>;
  height_nodes: Array<number>;
  material_weights: Array<number>;
  edge_nodes: Array<any>;
  pathing_water_unpathables: Array<any>;
  pathing_unbuildables: Array<any>;
  water_data: Array<number>;
};

export type PreplacedNamedObjects = Record<
  string,
  {
    data?: {
      seed: number;
    };
    facing: number;
    kind: string;
    player: number;
    position: Array<number>;
  }
>;

export interface RuntimeSession {
  archetypes: {
    [key: string]: Array<
      | number
      | {
          [key: string]:
            | Array<PurpleArchetype | number | string>
            | boolean
            | FluffyArchetype
            | number
            | string;
        }
    >;
  };
  assetReferences: { [key: string]: string };
  assetsToPreload: AssetsToPreload;
  localizedStringReferences: { [key: string]: string[] };
  snowplayBindings: SnowplayBindings;
}

export interface PurpleArchetype {
  charges?: Charges;
  cooldown?: Cooldown;
  cost_power?: number;
  cost_resources?: CostResources;
  cost_vitals?: CostVitals;
  cost_vitals_percentage?: CostVitals;
  requirement?: string;
  can_show?: AssetsToPreload;
  can_use?: any[];
  unit?: string;
  upgrade?: string;
  construction_effect?: Ability;
  overrides?: Overrides;
  validator?: Validator;
  spawn_count?: number;
  initial_count?: number;
  sound_mode?: string;
  sound_system_data?: string;
  stage?: string;
  allow_multiple?: boolean;
  allowed_presets?: string[];
  default_values?: DefaultValue[];
  hint_text?: string;
  id?: string;
  inline_separator?: string;
  is_callable?: boolean;
  is_this?: boolean;
  name?: string;
  type?: ValueType | TypeTypeEnum;
  preset_value_id?: string;
  same_as_param?: SameAsParam;
  allowed_functions?: string[];
  sub_functionId?: SubFunctionID;
  is_default?: boolean;
  script?: string;
  display_name?: string;
  value?: number | string;
  doodad?: string;
  influence?: number;
  weight?: number;
  check?: Check;
  reason?: string;
  reason_announcement?: ReasonAnnouncement;
  effects?: string[];
  end_projectile?: boolean;
  forward_offset?: number;
  max_targets?: number;
  target_filter?: Filter;
  target_validator?: Ability;
  width?: number;
  ability?: string;
  button?: string;
  commandIndex?: number;
  panel?: Panel;
  repeatable?: boolean;
  row?: number;
  slot?: number;
  submenu?: number;
  targetSubmenu?: number;
  stat_modifiers?: StatModifier[];
  threshold?: number;
  visual_fx?: VisualFx;
  amount?: number;
  stat_mod?: string;
  key?: string;
  damage_fraction?: number;
  radius?: number;
  field_name?: string;
  player_stat_mod?: string;
  action?: string;
  case_condition?: string;
  target_archetype?: string;
  target_property?: string;
  target_value?: number;
  modifiers?: Modifier[];
  unit_tag_filter?: TagsClass;
  function_id?: FunctionID;
  is_enabled?: boolean;
  parameters?: ArchetypeParameter[];
  sub_functions?: SubFunction[];
  array_size?: number;
  initial_values?: InitialValue[];
  is_array?: boolean;
  is_constant?: boolean;
  is_id_based_on_name?: boolean;
  per_element_initial_values?: boolean;
  attribute_instance_map_settings?: AttributeInstanceMapSettings;
  circle?: Circle;
  mode?: string;
  rectangle?: Rectangle;
  translation?: SpawnOffset;
  allow_location?: boolean;
  apply_filter?: Filter;
  display_option?: DisplayOption;
  initial_filter?: Filter;
  place_initial_rally?: boolean;
  x?: number;
  y?: number;
  offset?: SpawnOffset;
  edges?: Edge[];
  library_icon?: string;
  tab_icon?: string;
  type_name?: string;
  view_class?: string;
}

export interface Filter {
  alliance: Alliance;
  tags: TagsClass;
}

export interface Alliance {
  ally: boolean;
  enemy: boolean;
  neutral: boolean;
  player: boolean;
  self: boolean;
}

export interface TagsClass {
  excluded: Excluded[];
  required: Required[];
}

export enum Excluded {
  AttributeHero = "attribute_hero",
  AttributeInterceptor = "attribute_interceptor",
  AttributeObject = "attribute_object",
  AttributeResilient = "attribute_resilient",
  AttributeWorker = "attribute_worker",
  Capturable = "capturable",
  Dead = "dead",
  EntityDestructible = "entity_destructible",
  EntityDestructibleTree = "entity_destructible_tree",
  EntityResource = "entity_resource",
  EntityUnitCreep = "entity_unit_creep",
  EntityUnitStructure = "entity_unit_structure",
  HeightplaneAir = "heightplane_air",
  Mapobjective = "mapobjective",
  StateUnderconstruction = "state_underconstruction",
  StatusDormant = "status_dormant",
  StatusGrounded = "status_grounded",
  StatusInvulnerable = "status_invulnerable",
  StatusSleeping = "status_sleeping",
}

export enum Required {
  AttributeBiological = "attribute_biological",
  AttributeHeavy = "attribute_heavy",
  AttributeMechanical = "attribute_mechanical",
  AttributeWorker = "attribute_worker",
  Defensive = "defensive",
  EntityCreepcamp = "entity_creepcamp",
  EntityDestructibleTree = "entity_destructible_tree",
  EntityItem = "entity_item",
  EntityResource = "entity_resource",
  EntityResourceGenerator = "entity_resource_generator",
  EntityResourceGeneratorA = "entity_resource_generator_a",
  EntityResourceGeneratorB = "entity_resource_generator_b",
  EntityUnit = "entity_unit",
  EntityUnitCreep = "entity_unit_creep",
  EntityUnitStructure = "entity_unit_structure",
  HeightplaneAir = "heightplane_air",
  HeightplaneGround = "heightplane_ground",
}

export interface AttributeInstanceMapSettings {
  additional_overrides: any[];
  slot_type: SlotType;
  team: Team;
}

export interface SlotType {
  locked: boolean;
  value: string;
}

export interface Team {
  locked: boolean;
  value: number;
}

export interface AssetsToPreload {}

export interface Charges {
  max_count: number;
  name: ChargesName;
  recharge_duration: number;
  starting_count: number;
}

export enum ChargesName {
  CreepAbduction = "CreepAbduction",
  Default = "default",
  ImbueStructure = "ImbueStructure",
  InfernalTrainingBarrowFarm = "InfernalTrainingBarrowFarm",
  InfernalTrainingConclave = "InfernalTrainingConclave",
  InfernalTrainingIronVault = "InfernalTrainingIronVault",
  InfernalTrainingShrine = "InfernalTrainingShrine",
  InfernalTrainingTwilightSpire = "InfernalTrainingTwilightSpire",
  Purify = "Purify",
  ZenithScan = "ZenithScan",
}

export interface Check {
  root: CheckRoot;
  type: ArgumentType;
}

export interface CheckRoot {
  left?: PurpleLeft;
  node: ConditionNode;
  operator?: Operator;
  right?: FluffyRight;
  type: ArgumentType;
  value?: boolean;
}

export interface PurpleLeft {
  name?: LeftName;
  node: ConditionNode;
  parameters?: RightParameter[];
  type: ArgumentType;
  left?: FluffyLeft;
  operator?: Operator;
  right?: PurpleRight;
}

export interface FluffyLeft {
  name?: LeftName;
  node: ConditionNode;
  parameters?: RightParameter[];
  type: ArgumentType;
  left?: RightClass;
  operator?: Operator;
  right?: RightClass;
}

export interface RightClass {
  left: Condition;
  node: ConditionNode;
  operator: Operator;
  right: WhenTrue;
  type: ArgumentType;
}

export interface Condition {
  name?: string;
  node: ConditionNode;
  parameters?: ConditionParameter[];
  type: ArgumentType;
  value?: string[] | boolean | number | string;
}

export enum ConditionNode {
  Conditional = "Conditional",
  FunctionCall = "FunctionCall",
  Literal = "Literal",
  Logical = "Logical",
  Math = "Math",
}

export interface ConditionParameter {
  argument: PurpleArgument;
  name: UIKind;
  type: ArgumentType;
}

export interface PurpleArgument {
  name?: string;
  node: ConditionNode;
  parameters?: PurpleParameter[];
  type: ArgumentType;
  value?: Required[] | string;
}

export interface PurpleParameter {
  argument: FluffyArgument;
  name: UIKind;
  type: ArgumentType;
}

export interface FluffyArgument {
  node: ConditionNode;
  type: ArgumentType;
  value?: BuffScopeEffectParent;
  name?: string;
  parameters?: FluffyParameter[];
}

export interface FluffyParameter {
  argument: TentacledArgument;
  name: UIKind;
  type: ArgumentType;
}

export interface TentacledArgument {
  node: ConditionNode;
  type: ArgumentType;
  value: BuffScopeEffectParent;
}

export enum ArgumentType {
  Alias = "Alias",
  ArraySnowTag = "Array<SnowTag>",
  ArrayValidator = "Array<Validator>",
  Bool = "Bool",
  Buff = "Buff",
  Count = "Count",
  Destructible = "Destructible",
  Distance = "Distance",
  DistanceSquared = "Distance (Squared)",
  Entity = "Entity",
  Int = "Int",
  Name = "Name",
  Player = "Player",
  Time = "Time",
  TraitData = "TraitData",
  Unit = "Unit",
  UnitData = "UnitData",
  UpgradeData = "UpgradeData",
  Validator = "Validator",
  Value = "Value",
  Vector = "Vector",
}

export enum BuffScopeEffectParent {
  ArtilleryMechDeployedWeaponMissileLauncher = "ArtilleryMechDeployed_Weapon_MissileLauncher",
  ArtilleryMechWeaponMissileLauncher = "ArtilleryMech_Weapon_MissileLauncher",
  CatapultWeaponMissileLauncher = "Catapult_Weapon_MissileLauncher",
  CreepGoat02LaunchSelf = "CreepGoat02_LaunchSelf",
  CrushingChargePushOffset = "CrushingCharge_PushOffset",
  Empty = "",
  FlayedDragonInhalePoisonDamageSet = "FlayedDragon_InhalePoison_DamageSet",
  GauntWeaponBounceMissleLauncher1 = "Gaunt_Weapon_BounceMissleLauncher1",
  GauntWeaponBounceMissleLauncher2 = "Gaunt_Weapon_BounceMissleLauncher2",
  GhostBlinkPersistent = "GhostBlink_Persistent",
  HarmfulBuffNum = "harmful_buff_num",
  HealingFlowerRevengeSet = "HealingFlowerRevenge_Set",
  HealingGlobeSpawnPickup = "HealingGlobeSpawnPickup",
  HecubahNecroticBeam = "Hecubah_Necrotic_Beam",
  HecubahNecroticBeamStage1Persistent = "Hecubah_Necrotic_Beam_Stage1_Persistent",
  HecubahNecroticBeamStage2Persistent = "Hecubah_Necrotic_Beam_Stage2_Persistent",
  None = "none",
  Origin = "origin",
  ResourceBGeneratorBlockedSpawnPickup = "ResourceBGeneratorBlockedSpawnPickup",
  Scope = "scope",
  SentryPostLancerWeaponMissileLauncher1 = "SentryPostLancer_Weapon_MissileLauncher1",
  SentryPostLancerWeaponMissileLauncher2 = "SentryPostLancer_Weapon_MissileLauncher2",
  V5RocketLauncherWeaponMissileLauncher = "V5RocketLauncher_Weapon_MissileLauncher",
  VenomTrapWeaponSetSearchSecondary = "VenomTrap_Weapon_SetSearchSecondary",
  VoidGateKnockbackWeaponMissileLauncher = "VoidGateKnockback_Weapon_MissileLauncher",
  VoidGateKnockbackWeaponSearchRadius = "VoidGateKnockback_Weapon_SearchRadius",
  WeaverWhisperParasiteInitialMissileLauncher = "Weaver_Whisper_ParasiteInitial_MissileLauncher",
}

export enum UIKind {
  A = "a",
  AbilityDataName = "ability_data_name",
  Actor = "actor",
  Alias = "alias",
  Archetype = "archetype",
  B = "b",
  Buff = "buff",
  Distance = "distance",
  EffectParent = "effect_parent",
  EnabledOnly = "enabled_only",
  Entity = "entity",
  Key = "key",
  Location = "location",
  Lower = "lower",
  MagazineName = "magazine_name",
  Max = "max",
  Min = "min",
  Origin = "origin",
  Other = "other",
  Player = "player",
  Radius = "radius",
  Score = "score",
  Sorted = "sorted",
  Source = "source",
  Tags = "tags",
  Target = "target",
  Tracker = "tracker",
  Type = "type",
  UIKindA = "A",
  UIKindB = "B",
  Unit = "unit",
  UnitType = "unit_type",
  Upgrade = "upgrade",
  Upper = "upper",
  Validator = "validator",
  Validators = "validators",
  Vector = "vector",
  Who = "who",
}

export enum Operator {
  Ambitious = "/",
  Cunning = "+",
  Empty = ">",
  Fluffy = ">=",
  Frisky = "-",
  Hilarious = "!=",
  Indecent = "<=",
  Indigo = "!",
  Magenta = "*",
  Operator = "||",
  Purple = "<",
  Sticky = "&&",
  Tentacled = "==",
}

export interface WhenTrue {
  node: ConditionNode;
  type: ArgumentType;
  value: number;
}

export enum LeftName {
  ExpressionAPICountCompletedUnitsOfAlias = "ExpressionApi::count_completed_units_of_alias",
  ExpressionAPICountCompletedUnitsOfType = "ExpressionApi::count_completed_units_of_type",
  ExpressionAPICountCompletedUpgradeOfType = "ExpressionApi::count_completed_upgrade_of_type",
  ExpressionAPICountInProgressOrBetterUnitsOfType = "ExpressionApi::count_in_progress_or_better_units_of_type",
  ExpressionAPICountInQueueOrBetterUnitsOfAlias = "ExpressionApi::count_in_queue_or_better_units_of_alias",
  ExpressionAPIGetPowerProduced = "ExpressionApi::get_power_produced",
}

export interface RightParameter {
  argument: Condition;
  name: UIKind;
  type: ArgumentType;
}

export interface PurpleRight {
  node: ConditionNode;
  type: ArgumentType;
  value?: number;
  left?: RightClass;
  operator?: Operator;
  right?: RightClass;
}

export interface FluffyRight {
  node: ConditionNode;
  type: ArgumentType;
  value?: number;
  left?: Condition;
  operator?: Operator;
  right?: WhenTrue;
  name?: string;
  parameters?: RightParameter[];
}

export interface Circle {
  radius: number;
}

export enum Ability {
  EmptyRef = "emptyRef",
  ShroudstoneManifestationSet = "ShroudstoneManifestation_Set",
  SummonEffigySwitch = "SummonEffigy_Switch",
}

export interface Cooldown {
  duration: number;
  name: string;
  scope: Scope;
}

export enum Scope {
  Ability = "Ability",
  Player = "Player",
  Unit = "Unit",
}

export interface CostResources {
  resource_a: number;
  resource_b: number;
  resource_c: number;
  resource_d: number;
}

export interface CostVitals {
  energy: number;
  health: number;
}

export interface DefaultValue {
  function: Function;
  preset: DefaultValuePreset;
  script: string;
  type: ExpressionType;
  value: ValueClass;
  variable: DefaultValueVariable;
  literal?: Literal;
}

export interface SubFunction {
  functions: Function[];
  id: SubFunctionID;
}

export interface Expression {
  function: Function;
  preset: ExpressionPreset;
  script: string;
  type: ExpressionType;
  value: ValueClass;
  variable: DefaultValueVariable;
  literal?: Literal;
}

export interface FunctionParameter {
  expressions: Expression[];
  id: string;
  param_id?: string;
}

export interface Function {
  function_id: string;
  is_enabled: boolean;
  parameters: FunctionParameter[];
  sub_functions: SubFunction[];
  function?: string;
}

export enum SubFunctionID {
  Actions = "actions",
  Conditions = "conditions",
  Else = "else",
  If = "if",
  Then = "then",
}

export interface Literal {
  type: string;
  value: string;
}

export interface ExpressionPreset {
  preset_id: string;
  value_id: ValueID;
}

export enum ValueID {
  AITime = "ai_time",
  Add = "add",
  Add2 = "add2",
  And = "and",
  Any = "any",
  Empty = "",
  Eq = "eq",
  Gr = "gr",
  Gre = "gre",
  Harmful = "harmful",
  LTE = "lte",
  Lt = "lt",
  Minus = "minus",
  None = "none",
  Or = "or",
  Plus = "plus",
  Replace = "replace",
}

export enum ExpressionType {
  Function = "Function",
  Preset = "Preset",
  TypePreset = "preset",
  Value = "Value",
  Variable = "Variable",
}

export interface ValueClass {
  type: ValueType;
  value: string;
}

export interface ValueType {
  directive: Directive;
  implements: Implements;
  inner_type: string;
  param_id: SameAsParam;
  sub_directive: Directive;
  tags: string[];
  type: string;
  is_localized_string?: boolean;
}

export enum Directive {
  AnyCompare = "AnyCompare",
  AnyVariable = "AnyVariable",
  AssetRef = "AssetRef",
  FunctionType = "FunctionType",
  None = "None",
  Preset = "Preset",
  SameAsParam = "SameAsParam",
  SameAsParentParam = "SameAsParentParam",
  Script = "Script",
  TypeRef = "TypeRef",
}

export enum Implements {
  AbilityData = "ability_data",
  Empty = "",
  GameEffect = "game_effect",
  SnowbotAction = "snowbot_action",
}

export enum SameAsParam {
  Empty = "",
  Value = "value",
  Value1 = "value1",
  Variable = "variable",
}

export interface DefaultValueVariable {
  indices: any[];
  variable_id: VariableID;
  index?: number;
}

export enum VariableID {
  AirUnitCount = "air_unit_count",
  BestTarget = "best_target",
  CloseAllies = "close_allies",
  CloseEnemies = "close_enemies",
  CloseEnemyUnits = "close_enemy_units",
  DebuffCount = "debuff_count",
  Empty = "",
  EnemyAirUnitCount = "enemy_air_unit_count",
  EnemyGroundUnitCount = "enemy_ground_unit_count",
  EnemyGroundUnits = "enemy_ground_units",
  EnemyStructureCount = "enemy_structure_count",
  EnemyUnitGroup = "enemyUnitGroup",
  EnemyUnits = "enemy_units",
  EnemyUnitsInRange = "enemyUnitsInRange",
  HighestSupplyAmount = "highest_supply_amount",
  HighestSupplyUnit = "highest_supply_unit",
  InfestedEnemyUnitCount = "infested_enemy_unit_count",
  InfestedEnemyUnits = "infested_enemy_units",
  IntCountInfested = "int_count_infested",
}

export interface DefaultValuePreset {
  preset_id: string;
  value_id: string;
  value?: string;
}

export enum DisplayOption {
  Default = "Default",
  Worker = "Worker",
}

export interface Edge {
  default_node_config: Ability;
  executable: boolean;
  shareable: boolean;
  type_name: string;
}

export enum FunctionID {
  GameActivateEliminationWinCondition = "Game_ActivateEliminationWinCondition",
  GameOnMapInitialization = "Game_OnMapInitialization",
  GameSetStartingResources = "Game_SetStartingResources",
  GameSpawnStartingUnits = "Game_SpawnStartingUnits",
  GameSpawnTopBar = "Game_SpawnTopBar",
  TimerOnPeriodicEvent = "Timer_OnPeriodicEvent",
  UnitGroupForEachUnitInGroup = "UnitGroup_ForEachUnitInGroup",
}

export interface InitialValue {
  function: Function;
  preset: ExpressionPreset;
  script: string;
  type: ExpressionType;
  value: ValueClass;
  variable: InitialValueVariable;
}

export interface InitialValueVariable {
  indices: any[];
  variable_id: VariableID;
}

export interface Modifier {
  amount: number;
  stat_mod: string;
}

export interface SpawnOffset {
  x: number;
  y: number;
}

export interface Overrides {
  build_time: number;
  cost_resources: CostResources;
  ignore_unit_resource_cost: boolean;
}

export enum Panel {
  CommandPanel = "CommandPanel",
  TopBar = "TopBar",
}

export interface ArchetypeParameter {
  expressions: InitialValue[];
  id: string;
}

export enum ReasonAnnouncement {
  None = "None",
  Power = "Power",
}

export interface Rectangle {
  height: number;
  rotation: number;
  width: number;
}

export interface StatModifier {
  amount: number;
  stat: Stat;
}

export enum Stat {
  ArmorScaledAdditiveBonus = "ArmorScaledAdditiveBonus",
  AttackSpeedPercentageAdditiveMultiplier = "AttackSpeedPercentageAdditiveMultiplier",
  DamagePercentageBonus = "DamagePercentageBonus",
  EmptyRef = "emptyRef",
  EnergyRegenScaledAdditiveBonus = "EnergyRegenScaledAdditiveBonus",
  HealthMaxAdditiveBonus = "HealthMaxAdditiveBonus",
  SpeedPercentageBonus = "SpeedPercentageBonus",
  VisionRadiusScaledAdditiveBonus = "VisionRadiusScaledAdditiveBonus",
  WeaponRangeAdditiveBonus = "WeaponRangeAdditiveBonus",
  WorkerConstructionSpeedPercentageAdditiveBonus = "WorkerConstructionSpeedPercentageAdditiveBonus",
}

export enum TypeTypeEnum {
  Action = "Action",
  Circle = "circle",
  Condition = "Condition",
  Event = "Event",
}

export enum Validator {
  EmptyRef = "emptyRef",
  ValidShroudstoneManifestationLocation = "Valid_ShroudstoneManifestationLocation",
}

export enum VisualFx {
  BPFXVanguardLevelUpTier1 = "BP_FX_VanguardLevelUp_Tier1",
  BPFXVanguardLevelUpTier2 = "BP_FX_VanguardLevelUp_Tier2",
  BPFXVanguardLevelUpTier3 = "BP_FX_VanguardLevelUp_Tier3",
  Empty = "",
}

export interface FluffyArchetype {
  exclude?: VisionHolder[];
  include?: VisionHolder[];
  target_becomes_instigator?: boolean;
  best_unit?: boolean;
  cast_on_spawner?: boolean;
  cast_while_concealed?: boolean;
  channeled?: boolean;
  channeling_breaks_on_facing?: boolean;
  channeling_breaks_on_range?: boolean;
  channeling_breaks_on_vision?: boolean;
  count_as_attack?: boolean;
  harvest_on_game_start?: boolean;
  homogenous_interruption?: boolean;
  preempt?: boolean;
  prevent_activation?: boolean;
  progress_countdown?: boolean;
  reactive?: boolean;
  reapproach?: boolean;
  requires_vision?: boolean;
  show_progress?: boolean;
  silenceable?: boolean;
  uninterruptible_stages?: UninterruptibleStages;
  channel_execute_event?: boolean;
  channeling?: boolean;
  mark_exclusive_target?: boolean;
  use_attack_speed?: boolean;
  ignore_destructible_tree?: boolean;
  landing_spot_find?: boolean;
  landing_spot_reserve?: boolean;
  stop_at_unpathable?: boolean;
  detector?: boolean;
  display_ui_description?: boolean;
  has_prime_structure?: boolean;
  hologram?: boolean;
  overlap_resource_a?: boolean;
  requires_cascade_field?: boolean;
  requires_cascade_field_to_morph?: boolean;
  seek_and_destroy?: boolean;
  stealth?: boolean;
  uncommandable?: boolean;
  change_owner_on_polymorph?: boolean;
  disable_on_attacking?: boolean;
  disable_on_damage_taken?: boolean;
  hidden?: boolean;
  hide_timer?: boolean;
  override_source?: boolean;
  pause_while_disabled?: boolean;
  remove_on_attacking?: boolean;
  remove_on_damage_taken?: boolean;
  alert?: boolean;
  damage_response?: boolean;
  capture_from_higher?: boolean;
  capture_from_lower?: boolean;
  lock_after_capture?: boolean;
  display_as_attribute?: boolean;
  display_as_callout?: boolean;
  add_to_existing?: boolean;
  approach?: boolean | ApproachEnum;
  builds?: boolean;
  cancelable?: boolean;
  disable_abilities?: boolean;
  perform_height_transition?: boolean;
  placement?: boolean;
  unload_cargo?: boolean;
  upgrade?: boolean;
  can_attack_location?: boolean;
  fires_passively?: boolean;
  hide_weapon?: boolean;
  melee?: boolean;
  scan_for_new_targets?: boolean;
  find_placement?: boolean;
  follow_source_rally?: boolean;
  clear_order_queue?: boolean;
  activate_when_acquired?: boolean;
  drop_on_carrier_death?: boolean;
  is_consumable?: boolean;
  is_consumed_when_acquired?: boolean;
  is_droppable?: boolean;
  is_perishable?: boolean;
  apply_to_team?: boolean;
  disable_duplicates?: boolean;
  separate_positive_negative?: boolean;
  shared_with_team?: boolean;
  build_inside?: boolean;
  consume_worker?: boolean;
  redirect_commands_to_topbar?: boolean;
  requires_workers?: boolean;
  use_structure_radius?: boolean;
  require_vision?: boolean;
  set_facing?: boolean;
  dynamic_creeps?: boolean;
  hide_if_locked?: boolean;
  set_cooldown?: boolean;
  return_resource_a?: boolean;
  return_resource_b?: boolean;
  skip_acquired?: boolean;
  skip_first?: boolean;
  can_drop_items?: boolean;
  can_pickup_items?: boolean;
  can_use_items?: boolean;
  drop_items_on_death?: boolean;
  global?: boolean;
  global_filter?: string;
  capture_nearby_structures?: boolean;
  execute_effects_on_team?: boolean;
  units_are_neutral?: boolean;
  activation_requires_target?: boolean;
  change_owner?: boolean;
  kill_spawned_on_death?: boolean;
  kill_spawned_on_max_amount?: boolean;
  permanent?: boolean;
  allow_flee_without_idle?: boolean;
  fidget_after_wander?: boolean;
  suppress_default_behavior?: boolean;
  control_groups?: boolean;
  current_selection?: boolean;
  max_stack_only?: boolean;
  cargo_death?: boolean;
  quick_macro_allow_location?: boolean;
  smart_allow_location?: boolean;
  add_faction_luminite_worker_count?: boolean;
  hidden_from_triggers?: boolean;
  display_floating_text?: boolean;
  display_stolen_floating_text?: boolean;
  is_salvage?: boolean;
  kill_on_refund?: boolean;
  revive_player_hero?: boolean;
  respawn_immediately?: boolean;
  full_heal_while_holstered?: boolean;
  parallel_recharge?: boolean;
  set_to_tier?: boolean;
  alliance?: Alliance;
  tags?: any[] | TagsClass;
  effect_parent?: BuffScopeEffectParent;
  entity_or_point?: EntityOrPoint;
  target?: Target;
  autocast_filter?: Filter;
  autocasts?: boolean;
  exclusive_targeting?: boolean;
  initially_on?: boolean;
  range?: number;
  required_scan_level?: RequiredScanLevel;
  target_sorts?: string[];
  validator?: string;
  priority?: number;
  smart_filter?: Filter;
  cast?: Cast;
  channel?: Cast;
  finish?: Cast;
  prepare?: Ability;
  aggregation?: Aggregation;
  buff_scope_effect_parent?: BuffScopeEffectParent;
  decay?: number;
  initial?: Expire | number;
  maximum?: number;
  b?: number;
  g?: number;
  r?: number;
  x?: number;
  y?: number;
  icon?: string;
  node?: ArchetypeNode;
  is_async?: boolean;
  is_deprecated?: boolean;
  is_expression_only?: boolean;
  is_hidden?: boolean;
  is_implemented?: boolean;
  is_inline?: boolean;
  is_native?: boolean;
  directive?: Directive;
  implements?: Implements;
  inner_type?: string;
  param_id?: string;
  sub_directive?: Directive;
  type?: string;
  value?: ValueClass | string;
  is_localized_string?: boolean;
  root?: ArchetypeRoot;
  expire?: Expire;
  final?: Final;
  periodic?: Expire[];
  variance?: Expire;
  vector_facing_end?: VectorFacing;
  vector_facing_start?: VectorFacing;
  count?: number;
  durations?: number[];
  effects?: string[];
  duration?: number;
  effect?: Effect;
  vision_height?: number;
  vision_holder?: VisionHolder;
  vision_radius?: number;
  color?: Color;
  intensity?: number;
  overrideEnabled?: boolean;
  rotation?: Rotation;
  acceleration_time?: number;
  max_speed?: number;
  collision?: Collision;
  deceleration_time?: number;
  idle_pushable?: boolean;
  lock_facing?: boolean;
  moving_turn_period?: number;
  pathing_mode?: PathingMode;
  push_priority?: number;
  push_priority_same_team?: number;
  speed?: number;
  stationary_turn_period?: number;
  turn_radius?: number;
  turn_without_slowing?: boolean;
  resource_a?: number;
  resource_b?: number;
  resource_c?: number;
  resource_d?: number;
  birth?: Ability;
  constructed?: Constructed;
  creation?: Creation;
  death?: Death;
  revenge?: Revenge;
  delay_maximum?: number;
  delay_minimum?: number;
  turning_angle?: number;
  turning_duration?: number;
  weights?: Weights;
  angled?: boolean;
  clumpable?: boolean;
  snap?: boolean;
  unbuildable?: boolean;
  vision_block_height?: number;
  adjust_height?: boolean;
  duration_reversed?: number;
  target_height?: number;
  callout_attacks_air?: boolean;
  callout_attacks_ground?: boolean;
  regen?: number;
  starting?: number;
  radius?: number;
  target_filter?: Filter;
  armor_base_suppressed?: boolean;
  armor_negative_mod_suppressed?: boolean;
  armor_positive_mod_suppressed?: boolean;
  collision_suppressed?: boolean;
  grounded?: boolean;
  lifted?: boolean;
  stealth_suppressed?: boolean;
  disable_topbar?: boolean;
  whole_map_shrouded?: boolean;
  function?: Function;
  preset?: ExpressionPreset;
  script?: string;
  variable?: InitialValueVariable;
  energy?: Energy;
  health?: Energy;
  extent_x?: number;
  extent_y?: number;
  extent_z?: number;
  half_height?: number;
  inner_radius?: number;
  excluded?: string[];
  required?: string[];
  store_name?: StoreName;
  abilities?: number;
  vitals?: number;
  minimum?: number;
  display_as_shields?: boolean;
  remove_holding_buff_when_exhausted?: boolean;
  shields_max?: number;
  shields_max_expression?: ShieldsMaxExpression;
  chance?: number;
  charges?: number;
  cooldown?: Cooldown;
  location?: Location;
  required_effect?: RequiredEffect;
  response_effect?: string;
  response_fx?: ResponseFx;
  angle?: number;
  include_target?: boolean;
  alignment?: Alignment;
  ignored?: any[];
  ability?: Ability;
  commandIndex?: number;
  repeatable?: boolean;
  targetSubmenu?: number;
  item_id?: number;
  item_price?: string;
  app_id?: number;
  dev_app_id?: number;
  twitch_reward_id?: string;
  default_value?: number;
  locked?: boolean;
  show_in_custom_lobby?: boolean;
  show_in_internal_lobby?: boolean;
  show_on_ais?: boolean;
  show_on_occupied_humans?: boolean;
  user_edit_scope?: UserEditScope;
  user_editing_allowed?: UserEditingAllowed;
  air?: boolean;
  burrowed?: boolean;
  ground?: boolean;
  ground_tall?: boolean;
  item?: boolean;
  worker?: boolean;
  AED?: number;
  AUD?: number;
  BRL?: number;
  CAD?: number;
  CHF?: number;
  CLP?: number;
  CNY?: number;
  COP?: number;
  CRC?: number;
  EUR?: number;
  GBP?: number;
  HKD?: number;
  IDR?: number;
  ILS?: number;
  INR?: number;
  JPY?: number;
  KRW?: number;
  KWD?: number;
  KZT?: number;
  MXN?: number;
  MYR?: number;
  NOK?: number;
  NZD?: number;
  PEN?: number;
  PHP?: number;
  PLN?: number;
  QAR?: number;
  RUB?: number;
  SAR?: number;
  SGD?: number;
  THB?: number;
  TWD?: number;
  UAH?: number;
  UYU?: number;
  VND?: number;
  ZAR?: number;
  bottom_offset?: number;
  left_offset?: number;
  right_offset?: number;
  top_offset?: number;
  density?: number;
  enabled?: boolean;
  height?: number;
  actor?: string;
  parallax?: number;
  dawn_sound?: string;
  day_length?: number;
  dusk_sound?: string;
  scale?: number;
  starting_hour?: number;
  unit?: string;
  ability_commands?: any[];
  units?: any[];
  upgrades?: any[];
  percentage_multiplier_ally?: number;
  percentage_multiplier_enemy?: number;
  percentage_multiplier_neutral?: number;
  percentage_multiplier_player?: number;
  percentage_on_shroud?: number;
  percentage_supply?: number;
  percentage_veterancy_xp?: number;
  variation?: number;
  animate?: number;
  idle?: number;
  turn?: number;
  wander?: number;
  spawn_offset?: SpawnOffset;
  regen_amount?: number;
  regen_period?: number;
  buff?: string;
  structure_filter?: Filter;
  structure_sorts?: string[];
  node_type?: string;
  offsets?: SpawnOffset[];
  field0?: number;
  field1?: number;
}

export enum Aggregation {
  Source = "Source",
  SourceUnit = "SourceUnit",
  Target = "Target",
  TargetPlayer = "TargetPlayer",
}

export enum Alignment {
  All = "All",
  Harmful = "Harmful",
  Helpful = "Helpful",
  Neutral = "Neutral",
}

export enum ApproachEnum {
  EmptyRef = "emptyRef",
  ReturnToHangarBuffSpeed = "ReturnToHangar_BuffSpeed",
}

export enum Cast {
  AbilityDisable = "AbilityDisable",
  EmptyRef = "emptyRef",
  InvulnerableBuff = "Invulnerable_Buff",
}

export interface Collision {
  air: boolean;
  burrowed: boolean;
  ground: boolean;
  ground_tall: boolean;
  item: boolean;
  worker: boolean;
}

export interface Color {
  blue?: number;
  green?: number;
  red?: number;
  b?: number;
  g?: number;
  r?: number;
}

export enum Constructed {
  EmptyRef = "emptyRef",
  MorphToArcshipTier1Flying = "MorphToArcshipTier1Flying",
  TheriumPurifierCreateFreePrism = "TheriumPurifier_CreateFreePrism",
}

export enum Creation {
  CelestialPowerBuffsSet = "CelestialPowerBuffs_Set",
  ElderShrineCreationSet = "ElderShrine_CreationSet",
  EmptyRef = "emptyRef",
  GreaterAbsorptionCompleteUpgrade = "GreaterAbsorption_CompleteUpgrade",
}

export enum Death {
  BruteDeathSetInitial = "BruteDeath_SetInitial",
  EmptyRef = "emptyRef",
  ImpEnflamedWeaponDamageRadius = "ImpEnflamed_Weapon_DamageRadius",
  RadioactiveBloodSearchRadius = "RadioactiveBlood_SearchRadius",
  SquifCreateUnit = "Squif_CreateUnit",
}

export enum Effect {
  EmptyRef = "emptyRef",
  GrappleSearchRadiusTree = "Grapple_SearchRadiusTree",
  RocketChargeSearchRadiusTree = "RocketCharge_SearchRadiusTree",
  ShadowflyerDetonatedBuffApplier = "Shadowflyer_Detonated_BuffApplier",
}

export interface Energy {
  max: number;
  min: number;
  percent: number;
}

export enum EntityOrPoint {
  Entity = "Entity",
  EntityOrPoint = "EntityOrPoint",
  Point = "Point",
}

export interface VisionHolder {
  effect_parent: BuffScopeEffectParent;
  target: Target;
}

export enum Target {
  Caster = "Caster",
  Source = "Source",
  Target = "Target",
}

export interface Expire {
  angle: number;
  radius: number;
}

export interface Final {
  angle: number;
  radius: number;
  distance?: number;
}

export enum Location {
  Attacker = "attacker",
  Defender = "defender",
}

export enum ArchetypeNode {
  ActionEditorNode = "ActionEditorNode",
  WaitActionEditorNode = "WaitActionEditorNode",
}

export enum PathingMode {
  Flying = "Flying",
  Ground = "Ground",
}

export enum RequiredEffect {
  EmptyRef = "emptyRef",
  InfestDebuffDamage = "Infest_Debuff_Damage",
}

export enum RequiredScanLevel {
  Defensive = "Defensive",
  None = "None",
  Offensive = "Offensive",
  Passive = "Passive",
}

export enum ResponseFx {
  Empty = "",
  None = "None",
}

export enum Revenge {
  EmptyRef = "emptyRef",
  HealingFlowerRevengeSet = "HealingFlowerRevenge_Set",
  ResourcePickupRefund = "ResourcePickupRefund",
  SquifRewardSearchRadius = "Squif_Reward_SearchRadius",
}

export interface ArchetypeRoot {
  left?: TentacledLeft;
  node: ConditionNode;
  operator?: Operator;
  right?: StickyRight;
  type: ArgumentType;
  value?: boolean | number;
  name?: string;
  parameters?: RootParameter[];
  condition?: Condition;
  whenFalse?: WhenFalse;
  whenTrue?: WhenTrue;
}

export interface TentacledLeft {
  name?: string;
  node: ConditionNode;
  parameters?: RightParameter[];
  type: ArgumentType;
  left?: Condition;
  operator?: Operator;
  right?: TentacledRight;
}

export interface TentacledRight {
  node: ConditionNode;
  type: ArgumentType;
  value?: number;
  name?: string;
  parameters?: RightParameter[];
  left?: Condition;
  operator?: Operator;
  right?: RightRight;
}

export interface RightRight {
  node: ConditionNode;
  type: ArgumentType;
  value?: number;
  name?: string;
  parameters?: RightParameter[];
}

export interface RootParameter {
  argument: StickyArgument;
  name: UIKind;
  type: ArgumentType;
}

export interface StickyArgument {
  node: ConditionNode;
  type: ArgumentType;
  value?: string[] | number | string;
  name?: string;
  parameters?: RightParameter[];
  left?: Condition;
  operator?: Operator;
  right?: WhenTrue;
}

export interface StickyRight {
  node: ConditionNode;
  type: ArgumentType;
  value?: boolean | number;
  left?: Condition;
  operator?: Operator;
  right?: WhenTrue;
  name?: string;
  parameters?: RightParameter[];
  condition?: Condition;
  whenFalse?: WhenTrue;
  whenTrue?: WhenTrue;
}

export interface WhenFalse {
  condition: Condition;
  node: ConditionNode;
  type: ArgumentType;
  whenFalse: WhenTrue;
  whenTrue: WhenTrue;
}

export interface Rotation {
  pitch: number;
  roll: number;
  yaw: number;
}

export interface ShieldsMaxExpression {
  root?: ShieldsMaxExpressionRoot;
  type?: ArgumentType;
}

export interface ShieldsMaxExpressionRoot {
  left: WhenTrue;
  node: ConditionNode;
  operator: Operator;
  right: IndigoRight;
  type: ArgumentType;
}

export interface IndigoRight {
  left: Condition;
  node: ConditionNode;
  operator: Operator;
  right: RightRight;
  type: ArgumentType;
}

export enum StoreName {
  Empty = "",
  NumBuffsDispelled = "num_buffs_dispelled",
}

export interface UninterruptibleStages {
  approach: boolean;
  cast: boolean;
  channel: boolean;
  finish: boolean;
  prepare: boolean;
}

export interface UserEditScope {
  anyone: boolean;
  lobby_owner: boolean;
  slot_occupant: boolean;
}

export enum UserEditingAllowed {
  Always = "Always",
  Never = "Never",
  Noncompetitive = "Noncompetitive",
}

export interface VectorFacing {
  effect_parent: BuffScopeEffectParent;
  entity_or_point: EntityOrPoint;
  target: Target;
}

export interface Weights {
  animate: number;
  idle: number;
  turn: number;
}

export interface SnowplayBindings {
  keys: { [key: string]: Key };
  mappings: Mappings;
}

export interface Key {
  KeyName: string;
  UiMapping: string;
  ValueHash: number;
  ValueType: ValueTypeEnum;
}

export enum ValueTypeEnum {
  ID = "ID",
  Time = "time",
  Value = "Value",
  ValueTypeTime = "Time",
}

export interface Mappings {
  buff: Buff;
  capture_point: CapturePoint;
  creep_camp: CreepCamp;
  destructible: Destructible;
  item: Item;
  projectile: Projectile;
  resource: Resource;
  snowtags: Snowtags;
  trait: Trait;
  unit: Unit;
}

export interface Buff {
  Data: BuffData;
  UiKind: UIKind;
}

export interface BuffData {
  type: PurpleType;
}

export interface PurpleType {
  alignment: string;
  duration: string;
  hidden: string;
  hide_timer: string;
  icon: string;
  name: string;
  showProgress: string;
  tooltip: string;
}

export interface CapturePoint {
  Data: CapturePointData;
  UiKind: string;
}

export interface CapturePointData {
  type: FluffyType;
}

export interface FluffyType {
  capture_range: string;
  fog_visibility: string;
  icon: string;
}

export interface CreepCamp {
  Data: CreepCampData;
  UiKind: string;
}

export interface CreepCampData {
  type: TentacledType;
}

export interface TentacledType {
  color_b: string;
  color_g: string;
  color_r: string;
  fog_visibility: string;
  icon: string;
  minimap_icon: string;
  minimap_icon_size: string;
  name: string;
}

export interface Destructible {
  Data: DestructibleData;
  UiKind: string;
}

export interface DestructibleData {
  display: PurpleDisplay;
  type: StickyType;
}

export interface PurpleDisplay {
  description: string;
  displayName: string;
  icon: string;
  minimap_icon: string;
  minimap_icon_size: string;
  minimap_icon_use_heading: string;
  minimap_icon_use_team_color: string;
  vitals_force_hide: string;
}

export interface StickyType {
  fog_visibility: string;
}

export interface Item {
  Data: ItemData;
  UiKind: string;
}

export interface ItemData {
  abilities: PurpleAbilities;
  command: { [key: string]: string };
  type: IndigoType;
}

export interface PurpleAbilities {
  command: string;
  unitCost: string;
  unitCostSupply: string;
}

export interface IndigoType {
  description: string;
  icon: string;
  maxStacks: string;
  name: string;
  tooltip: string;
}

export interface Projectile {
  Data: ProjectileData;
  UiKind: string;
}

export interface ProjectileData {
  display: FluffyDisplay;
}

export interface FluffyDisplay {
  minimap_icon: string;
  minimap_icon_size: string;
  minimap_icon_use_heading: string;
  minimap_icon_use_team_color: string;
}

export interface Resource {
  Data: ResourceData;
  UiKind: string;
}

export interface ResourceData {
  type: IndecentType;
}

export interface IndecentType {
  description: string;
  fog_visibility: string;
  max_harvesters: string;
  max_resources: string;
  minimap_icon: string;
  minimap_icon_size: string;
  name: string;
  resource_type: string;
  use_harvester_faction_bonus: string;
}

export interface Snowtags {
  Data: SnowtagsData;
  UiKind: string;
}

export interface SnowtagsData {
  type: HilariousType;
}

export interface HilariousType {
  displayAsAttribute: string;
  displayAsCallout: string;
  displayName: string;
}

export interface Trait {
  Data: TraitData;
  UiKind: string;
}

export interface TraitData {
  type: TraitsClass;
}

export interface TraitsClass {
  icon: string;
  name: string;
  requirementReasons?: string;
  tooltip: string;
}

export interface Unit {
  Data: UnitData;
  UiKind: UIKind;
}

export interface UnitData {
  abilities: FluffyAbilities;
  armor: Armor;
  callouts: Callouts;
  command: { [key: string]: string };
  display: PurpleDisplay;
  energy_bar: EnergyBar;
  faction: Faction;
  health_bar: Bar;
  power: Power;
  shield_bar: Bar;
  timer: Timer;
  timer1: Timer;
  traits: TraitsClass;
  type: AmbitiousType;
  veterancy: Veterancy;
  weapons: Weapons;
}

export interface FluffyAbilities {
  commands: string;
  unitCost: string;
  unitCostSupply: string;
}

export interface Armor {
  amount: string;
  icon: string;
  name: string;
  speed: string;
}

export interface Callouts {
  displayAsAttribute: string;
  displayName: string;
}

export interface EnergyBar {
  max: string;
  min: string;
}

export interface Faction {
  build: string;
  buildAdvanced: string;
  characterImage: string;
  description: string;
  descriptionTitle: string;
  harvesterBonusCount: string;
  icon: string;
  name: string;
  research: string;
  researchAdvanced: string;
  storeItem: string;
  train: string;
  trainAdvanced: string;
}

export interface Bar {
  max: string;
}

export interface Power {
  power_consumed: string;
  power_produced: string;
}

export interface Timer {
  duration: string;
}

export interface AmbitiousType {
  display_ui_description: string;
  fog_visibility: string;
  uncommandable: string;
}

export interface Veterancy {
  statModAmount: string;
  statModDescription: string;
  threshold: string;
}

export interface Weapons {
  damage: string;
  hide_weapon: string;
  icon: string;
  name: string;
  range: string;
  speed: string;
  targets: string;
}

export type Archetypes = {
  Enum: {
    AIWingmanStyle: {
      values: Array<{
        display_name: string;
        name: string;
        value: number;
      }>;
    };
    AiStyle: {
      values: Array<{
        display_name: string;
        name: string;
        value: number;
      }>;
    };
    CommanderType: {
      values: Array<{
        display_name: string;
        name: string;
        value: number;
      }>;
    };
    FactionType: {
      values: Array<{
        display_name: string;
        name: string;
        value: number;
      }>;
    };
    SlotType: {
      values: Array<{
        display_name: string;
        name: string;
        value: number;
      }>;
    };
    TeamNumber: {
      values: Array<{
        display_name: string;
        name: string;
        value: number;
      }>;
    };
    VeterancyTierType: {
      values: Array<{
        display_name: string;
        name: string;
        value: number;
      }>;
    };
    VisionType: {
      values: Array<{
        display_name: string;
        name: string;
        value: number;
      }>;
    };
  };
  MapSettings: {
    defaultMapSettings: {
      camera_bounds: {
        bottom_offset: number;
        left_offset: number;
        right_offset: number;
        top_offset: number;
      };
      cloud_blackboard: string;
      construction_preview_bp: string;
      corpse_expiration_scale: number;
      description: string;
      fog: {
        color: {
          b: number;
          g: number;
          r: number;
        };
        density: number;
        enabled: boolean;
        height: number;
      };
      lighting_settings: string;
      loading_widget: string;
      map_music: string;
      playable_bounds: {
        bottom_offset: number;
        left_offset: number;
        right_offset: number;
        top_offset: number;
      };
      player_attributes: Array<string>;
      player_slots: Array<any>;
      shroud_shrink_scale: number;
      shroud_time_per_radius_unit: number;
      skybox: {
        actor: string;
        enabled: boolean;
        parallax: number;
      };
      starting_worker_count: number;
      sub_title: string;
      tileset: string;
      time_of_day: {
        dawn_sound: string;
        day_length: number;
        dusk_sound: string;
        scale: number;
        starting_hour: number;
      };
      title: string;
      veterancy_xp_share_radius: number;
      win_condition: string;
    };
    useMapSettings: {
      camera_bounds: {
        bottom_offset: number;
        left_offset: number;
        right_offset: number;
        top_offset: number;
      };
      cloud_blackboard: string;
      construction_preview_bp: string;
      corpse_expiration_scale: number;
      description: string;
      fog: {
        color: {
          b: number;
          g: number;
          r: number;
        };
        density: number;
        enabled: boolean;
        height: number;
      };
      lighting_settings: string;
      loading_widget: string;
      map_music: string;
      playable_bounds: {
        bottom_offset: number;
        left_offset: number;
        right_offset: number;
        top_offset: number;
      };
      player_attributes: Array<string>;
      player_slots: Array<{
        attribute_instance_map_settings: {
          additional_overrides: Array<any>;
          slot_type: {
            locked: boolean;
            value: string;
          };
          team: {
            locked: boolean;
            value: number;
          };
        };
      }>;
      shroud_shrink_scale: number;
      shroud_time_per_radius_unit: number;
      skybox: {
        actor: string;
        enabled: boolean;
        parallax: number;
      };
      starting_worker_count: number;
      sub_title: string;
      tileset: string;
      time_of_day: {
        dawn_sound: string;
        day_length: number;
        dusk_sound: string;
        scale: number;
        starting_hour: number;
      };
      title: string;
      veterancy_xp_share_radius: number;
      win_condition: string;
    };
  };
  PlayerAttributeDefinition: {
    aiStyleAttributeDefinition: {
      attribute_id: string;
      default_instance_map_settings: {
        default_value: number;
        locked: boolean;
      };
      display_name: string;
      display_settings: {
        show_in_custom_lobby: boolean;
        show_in_internal_lobby: boolean;
        show_on_ais: boolean;
        show_on_occupied_humans: boolean;
      };
      permission_settings: {
        user_edit_scope: {
          anyone: boolean;
          lobby_owner: boolean;
          slot_occupant: boolean;
        };
        user_editing_allowed: string;
      };
      value_kind: number;
      values: string;
      values_as_typeref_enum: Array<any>;
    };
    aiWingmanAttributeDefinition: {
      attribute_id: string;
      default_instance_map_settings: {
        default_value: number;
        locked: boolean;
      };
      display_name: string;
      display_settings: {
        show_in_custom_lobby: boolean;
        show_in_internal_lobby: boolean;
        show_on_ais: boolean;
        show_on_occupied_humans: boolean;
      };
      permission_settings: {
        user_edit_scope: {
          anyone: boolean;
          lobby_owner: boolean;
          slot_occupant: boolean;
        };
        user_editing_allowed: string;
      };
      value_kind: number;
      values: string;
      values_as_typeref_enum: Array<any>;
    };
    armySkinAttributeDefinition: {
      attribute_id: string;
      default_instance_map_settings: {
        default_value: number;
        locked: boolean;
      };
      display_name: string;
      display_settings: {
        show_in_custom_lobby: boolean;
        show_in_internal_lobby: boolean;
        show_on_ais: boolean;
        show_on_occupied_humans: boolean;
      };
      permission_settings: {
        user_edit_scope: {
          anyone: boolean;
          lobby_owner: boolean;
          slot_occupant: boolean;
        };
        user_editing_allowed: string;
      };
      value_kind: number;
      values: string;
      values_as_typeref_enum: Array<any>;
    };
    colorVariationAttributeDefinition: {
      attribute_id: string;
      default_instance_map_settings: {
        default_value: number;
        locked: boolean;
      };
      display_name: string;
      display_settings: {
        show_in_custom_lobby: boolean;
        show_in_internal_lobby: boolean;
        show_on_ais: boolean;
        show_on_occupied_humans: boolean;
      };
      permission_settings: {
        user_edit_scope: {
          anyone: boolean;
          lobby_owner: boolean;
          slot_occupant: boolean;
        };
        user_editing_allowed: string;
      };
      value_kind: number;
      values: string;
      values_as_typeref_enum: Array<any>;
    };
    commanderLevelAttributeDefinition: {
      attribute_id: string;
      default_instance_map_settings: {
        default_value: number;
        locked: boolean;
      };
      display_name: string;
      display_settings: {
        show_in_custom_lobby: boolean;
        show_in_internal_lobby: boolean;
        show_on_ais: boolean;
        show_on_occupied_humans: boolean;
      };
      permission_settings: {
        user_edit_scope: {
          anyone: boolean;
          lobby_owner: boolean;
          slot_occupant: boolean;
        };
        user_editing_allowed: string;
      };
      value_kind: number;
      values: string;
      values_as_typeref_enum: Array<any>;
    };
    factionAttributeDefinition: {
      attribute_id: string;
      default_instance_map_settings: {
        default_value: number;
        locked: boolean;
      };
      display_name: string;
      display_settings: {
        show_in_custom_lobby: boolean;
        show_in_internal_lobby: boolean;
        show_on_ais: boolean;
        show_on_occupied_humans: boolean;
      };
      permission_settings: {
        user_edit_scope: {
          anyone: boolean;
          lobby_owner: boolean;
          slot_occupant: boolean;
        };
        user_editing_allowed: string;
      };
      value_kind: number;
      values: string;
      values_as_typeref_enum: Array<any>;
    };
    fogOfWarAttributeDefinition: {
      attribute_id: string;
      default_instance_map_settings: {
        default_value: number;
        locked: boolean;
      };
      display_name: string;
      display_settings: {
        show_in_custom_lobby: boolean;
        show_in_internal_lobby: boolean;
        show_on_ais: boolean;
        show_on_occupied_humans: boolean;
      };
      permission_settings: {
        user_edit_scope: {
          anyone: boolean;
          lobby_owner: boolean;
          slot_occupant: boolean;
        };
        user_editing_allowed: string;
      };
      value_kind: number;
      values: string;
      values_as_typeref_enum: Array<any>;
    };
    gear1AttributeDefinition: {
      attribute_id: string;
      default_data: string;
      default_instance_map_settings: {
        default_value: number;
        locked: boolean;
      };
      display_name: string;
      display_settings: {
        show_in_custom_lobby: boolean;
        show_in_internal_lobby: boolean;
        show_on_ais: boolean;
        show_on_occupied_humans: boolean;
      };
      permission_settings: {
        user_edit_scope: {
          anyone: boolean;
          lobby_owner: boolean;
          slot_occupant: boolean;
        };
        user_editing_allowed: string;
      };
      value_kind: number;
      values: string;
      values_as_typeref_enum: Array<any>;
    };
    gear2AttributeDefinition: {
      attribute_id: string;
      default_data: string;
      default_instance_map_settings: {
        default_value: number;
        locked: boolean;
      };
      display_name: string;
      display_settings: {
        show_in_custom_lobby: boolean;
        show_in_internal_lobby: boolean;
        show_on_ais: boolean;
        show_on_occupied_humans: boolean;
      };
      permission_settings: {
        user_edit_scope: {
          anyone: boolean;
          lobby_owner: boolean;
          slot_occupant: boolean;
        };
        user_editing_allowed: string;
      };
      value_kind: number;
      values: string;
      values_as_typeref_enum: Array<any>;
    };
    gear3AttributeDefinition: {
      attribute_id: string;
      default_data: string;
      default_instance_map_settings: {
        default_value: number;
        locked: boolean;
      };
      display_name: string;
      display_settings: {
        show_in_custom_lobby: boolean;
        show_in_internal_lobby: boolean;
        show_on_ais: boolean;
        show_on_occupied_humans: boolean;
      };
      permission_settings: {
        user_edit_scope: {
          anyone: boolean;
          lobby_owner: boolean;
          slot_occupant: boolean;
        };
        user_editing_allowed: string;
      };
      value_kind: number;
      values: string;
      values_as_typeref_enum: Array<any>;
    };
    globalPerkTestSlotAttributeDefinition: {
      attribute_id: string;
      default_instance_map_settings: {
        default_value: number;
        locked: boolean;
      };
      display_name: string;
      display_settings: {
        show_in_custom_lobby: boolean;
        show_in_internal_lobby: boolean;
        show_on_ais: boolean;
        show_on_occupied_humans: boolean;
      };
      permission_settings: {
        user_edit_scope: {
          anyone: boolean;
          lobby_owner: boolean;
          slot_occupant: boolean;
        };
        user_editing_allowed: string;
      };
      value_kind: number;
      values: string;
      values_as_typeref_enum: Array<string>;
    };
    pet1AttributeDefinition: {
      attribute_id: string;
      default_instance_map_settings: {
        default_value: number;
        locked: boolean;
      };
      display_name: string;
      display_settings: {
        show_in_custom_lobby: boolean;
        show_in_internal_lobby: boolean;
        show_on_ais: boolean;
        show_on_occupied_humans: boolean;
      };
      permission_settings: {
        user_edit_scope: {
          anyone: boolean;
          lobby_owner: boolean;
          slot_occupant: boolean;
        };
        user_editing_allowed: string;
      };
      value_kind: number;
      values: string;
      values_as_typeref_enum: Array<any>;
    };
    pet2AttributeDefinition: {
      attribute_id: string;
      default_instance_map_settings: {
        default_value: number;
        locked: boolean;
      };
      display_name: string;
      display_settings: {
        show_in_custom_lobby: boolean;
        show_in_internal_lobby: boolean;
        show_on_ais: boolean;
        show_on_occupied_humans: boolean;
      };
      permission_settings: {
        user_edit_scope: {
          anyone: boolean;
          lobby_owner: boolean;
          slot_occupant: boolean;
        };
        user_editing_allowed: string;
      };
      value_kind: number;
      values: string;
      values_as_typeref_enum: Array<any>;
    };
    pet3AttributeDefinition: {
      attribute_id: string;
      default_instance_map_settings: {
        default_value: number;
        locked: boolean;
      };
      display_name: string;
      display_settings: {
        show_in_custom_lobby: boolean;
        show_in_internal_lobby: boolean;
        show_on_ais: boolean;
        show_on_occupied_humans: boolean;
      };
      permission_settings: {
        user_edit_scope: {
          anyone: boolean;
          lobby_owner: boolean;
          slot_occupant: boolean;
        };
        user_editing_allowed: string;
      };
      value_kind: number;
      values: string;
      values_as_typeref_enum: Array<any>;
    };
    pet4AttributeDefinition: {
      attribute_id: string;
      default_instance_map_settings: {
        default_value: number;
        locked: boolean;
      };
      display_name: string;
      display_settings: {
        show_in_custom_lobby: boolean;
        show_in_internal_lobby: boolean;
        show_on_ais: boolean;
        show_on_occupied_humans: boolean;
      };
      permission_settings: {
        user_edit_scope: {
          anyone: boolean;
          lobby_owner: boolean;
          slot_occupant: boolean;
        };
        user_editing_allowed: string;
      };
      value_kind: number;
      values: string;
      values_as_typeref_enum: Array<any>;
    };
    slotTypeAttributeDefinition: {
      attribute_id: string;
      default_instance_map_settings: {
        default_value: number;
        locked: boolean;
      };
      display_name: string;
      display_settings: {
        show_in_custom_lobby: boolean;
        show_in_internal_lobby: boolean;
        show_on_ais: boolean;
        show_on_occupied_humans: boolean;
      };
      is_unique_per_player: boolean;
      permission_settings: {
        user_edit_scope: {
          anyone: boolean;
          lobby_owner: boolean;
          slot_occupant: boolean;
        };
        user_editing_allowed: string;
      };
      value_kind: number;
      values: string;
      values_as_typeref_enum: Array<any>;
    };
    teamAttributeDefinition: {
      attribute_id: string;
      default_instance_map_settings: {
        default_value: number;
        locked: boolean;
      };
      display_name: string;
      display_settings: {
        show_in_custom_lobby: boolean;
        show_in_internal_lobby: boolean;
        show_on_ais: boolean;
        show_on_occupied_humans: boolean;
      };
      permission_settings: {
        user_edit_scope: {
          anyone: boolean;
          lobby_owner: boolean;
          slot_occupant: boolean;
        };
        user_editing_allowed: string;
      };
      value_kind: number;
      values: string;
      values_as_typeref_enum: Array<any>;
    };
  };
  Score: {
    score_creep_resources_collected: {
      display_name: string;
      display_on_score_screen: boolean;
      score_id: string;
      upload_with_match_results: boolean;
    };
    score_resources_mined: {
      display_name: string;
      display_on_score_screen: boolean;
      score_id: string;
      upload_with_match_results: boolean;
    };
    score_structures_killed: {
      display_name: string;
      display_on_score_screen: boolean;
      score_id: string;
      upload_with_match_results: boolean;
    };
    score_units_killed: {
      display_name: string;
      display_on_score_screen: boolean;
      score_id: string;
      upload_with_match_results: boolean;
    };
    score_xp: {
      display_name: string;
      display_on_score_screen: boolean;
      score_id: string;
      upload_with_match_results: boolean;
    };
  };
  SnowTag: {
    alignment_negative: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    alignment_neutral: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    alignment_positive: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    alliance: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    alliance_enemy: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    alliance_friendly: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    alliance_neutral: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    attribute: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    attribute_biological: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    attribute_fortified: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    attribute_heavy: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    attribute_hero: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    attribute_interceptor: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    attribute_item: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    attribute_light: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    attribute_mechanical: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    attribute_medium: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    attribute_melee: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    attribute_object: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    attribute_ranged: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    attribute_resilient: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    attribute_topbar: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    attribute_worker: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    autoharvester: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    capturable: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    cheat: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    cheat_cooldown: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    cheat_food: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    cheat_free: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    cheat_tech: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    damage_melee: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    damage_ranged: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    damage_spell: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    damage_splash: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    dead: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    defensive: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    disabled: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    dispel: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    dispel_systemshock: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    dispel_technological: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    entity: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    entity_creepcamp: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    entity_destructible: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    entity_destructible_generator: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    entity_destructible_tree: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    entity_item: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    entity_pet: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    entity_projectile: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    entity_resource: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    entity_resource_a: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    entity_resource_b: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    entity_resource_generator: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    entity_resource_generator_a: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    entity_resource_generator_b: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    entity_unit: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    entity_unit_creep: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    entity_unit_critter: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    entity_unit_structure: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    heightplane_air: {
      display: string;
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    heightplane_ground: {
      display: string;
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    immunity_persistent: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    mapobjective: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    mapobjective_primary: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    mapobjective_secondary: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    preventdefeat_elimination: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    state: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    state_morphing: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    state_objective: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    state_resourcedropoff: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    state_resourcedropoff_a: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    state_resourcedropoff_b: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    state_underconstruction: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    status_burning: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    status_dormant: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    status_grounded: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    status_healing: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    status_holdfire: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    status_invulnerable: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    status_launched: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    status_lifted: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    status_pacified: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    status_paused: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    status_silenced: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    status_sleeping: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    status_slowed: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    status_stealthed: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    status_stealthening: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    status_stunned: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    status_suppressed: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    status_timedlife: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    status_weapons_alternate: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    supply: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    townhall: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    visual_fogofwar_ignore: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    visual_minimap: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    visual_minimap_always: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    visual_minimap_never: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    weapon: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
    worker_blink_once: {
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
    };
  };
};
