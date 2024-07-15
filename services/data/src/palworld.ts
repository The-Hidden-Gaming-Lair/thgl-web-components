import { initDict, writeDict } from "./lib/dicts.js";
import { CONTENT_DIR, OUTPUT_DIR, TEXTURE_DIR, initDirs } from "./lib/dirs.js";
import { initFilters, writeFilters } from "./lib/filters.js";
import { readDirSync, readJSON } from "./lib/fs.js";
import { saveIcon } from "./lib/image.js";
import { calculateDistance, initNodes, writeNodes } from "./lib/nodes.js";
import { generateTiles, initTiles, writeTiles } from "./lib/tiles.js";
import { initTypesIDs, writeTypesIDs } from "./lib/types-ids.js";
import { Node } from "./types.js";

initDirs(
  "/mnt/c/dev/Palworld/Extracted/Data",
  "/mnt/c/dev/Palworld/Extracted/Texture",
  "/home/devleon/the-hidden-gaming-lair/static/palworld",
);

const TILE_SIZE = 512;
const MAP_BOUNDS = [
  [-582888, -301000],
  [335112, 617000],
] as [[number, number], [number, number]];

const REAL_SIZE = MAP_BOUNDS[1][0] - MAP_BOUNDS[0][0];
const MULTIPLE = REAL_SIZE / TILE_SIZE;
const OFFSET = [-MAP_BOUNDS[0][1] / MULTIPLE, MAP_BOUNDS[1][0] / MULTIPLE];

await generateTiles(
  "default",
  TEXTURE_DIR + "/Pal/Content/Pal/Texture/UI/map/T_WorldMap.png",
  REAL_SIZE,
  TILE_SIZE,
);
const tiles = initTiles({
  default: {
    url: `/map-tiles/default/{z}/{y}/{x}.webp`,
    options: {
      minNativeZoom: 0,
      maxNativeZoom: 4,
      bounds: MAP_BOUNDS,
      tileSize: TILE_SIZE,
    },
    minZoom: 0,
    maxZoom: 5,
    fitBounds: MAP_BOUNDS,
    transformation: [1 / MULTIPLE, OFFSET[0], -1 / MULTIPLE, OFFSET[1]],
  },
});

writeTiles(tiles);

const mainWorld = readJSON<PL_MainWorld5>(
  CONTENT_DIR + "/Pal/Content/Pal/Maps/MainWorld_5/PL_MainWorld5.json",
);
const palxdexDistributionData = readJSON<DT_PaldexDistributionData>(
  CONTENT_DIR + "/Pal/Content/Pal/DataTable/UI/DT_PaldexDistributionData.json",
);
const palNameText = readJSON<DT_PalNameText>(
  CONTENT_DIR + "/Pal/Content/L10N/en/Pal/DataTable/Text/DT_PalNameText.json",
);
const uiCommonText = readJSON<DT_UI_Common_Text>(
  CONTENT_DIR +
    "/Pal/Content/L10N/en/Pal/DataTable/Text/DT_UI_Common_Text.json",
);
const palLongDescriptionText = readJSON<DT_PalLongDescriptionText>(
  CONTENT_DIR +
    "/Pal/Content/L10N/en/Pal/DataTable/Text/DT_PalLongDescriptionText.json",
);
const mapRespawnPointInfoText = readJSON<DT_MapRespawnPointInfoText>(
  CONTENT_DIR +
    "/Pal/Content/L10N/en/Pal/DataTable/Text/DT_MapRespawnPointInfoText.json",
);
const palMonsterParameter = readJSON<DT_PalMonsterParameter>(
  CONTENT_DIR +
    "/Pal/Content/Pal/DataTable/Character/DT_PalMonsterParameter.json",
);
const palCharacterIconDataTable = readJSON<DT_PalCharacterIconDataTable>(
  CONTENT_DIR +
    "/Pal/Content/Pal/DataTable/Character/DT_PalCharacterIconDataTable.json",
);
const newNodes = initNodes();
const enDict = initDict(readJSON(OUTPUT_DIR + "/dicts/en.json"));
const typesIDs = initTypesIDs(
  readJSON(OUTPUT_DIR + "/coordinates/types_id_map.json"),
);
const filters = initFilters(
  readJSON(OUTPUT_DIR + "/coordinates/filters.json"),
).filter((f) => f.group !== "pal_common" && f.group !== "pal_alpha");

const oldNodes = readJSON<Node[]>(OUTPUT_DIR + "/coordinates/nodes.json");

for (const path of readDirSync(
  CONTENT_DIR + "/Pal/Content/Pal/Maps/MainWorld_5/PL_MainWorld5/_Generated_",
)) {
  const data = readJSON<PL_MainWorld5>(
    CONTENT_DIR +
      "/Pal/Content/Pal/Maps/MainWorld_5/PL_MainWorld5/_Generated_/" +
      path,
  );
  for (const node of data) {
    if (
      node.Type !== "SceneComponent" ||
      !node.Properties?.RelativeLocation ||
      !node.Outer
    ) {
      continue;
    }
    let group = "";
    let size = 2;
    let icon = "";
    let type = "";
    let isStatic = false;
    let id = "";

    if (node.Outer.startsWith("BP_LevelObject_OilField_")) {
      group = "resources";
      type = "crude_oil";
      enDict["crude_oil"] = "Crude Oil";
      icon = await saveIcon(
        "/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/oil-pump_delapouite.webp",
        type,
      );
      size = 1.5;
    } else {
      continue;
    }

    const bp = node.Outer.split("_C")[0] + "_C";
    typesIDs[bp] = type;

    if (!newNodes.some((n) => n.type === type)) {
      const nodeDef: Node = {
        type,
        spawns: [],
      };
      if (isStatic) {
        nodeDef.static = true;
      }
      newNodes.push(nodeDef);
    }
    const nodesSpawns = newNodes.find((n) => n.type === type)!;

    const spawn: Node["spawns"][0] = {
      p: [
        node.Properties.RelativeLocation.X,
        node.Properties.RelativeLocation.Y,
      ],
    };
    if (id) {
      spawn.id = id;
    }
    nodesSpawns.spawns.push(spawn);

    if (!filters.find((f) => f.group === group)) {
      filters.push({
        group: group,
        values: [],
      });
    }
    const category = filters.find((f) => f.group === group)!;
    if (!category.values.some((v) => v.id === type)) {
      category.values.push({
        id: type,
        icon,
        size,
      });
    }
  }
}

for (const node of mainWorld) {
  if (
    node.Type !== "SceneComponent" ||
    !node.Properties?.RelativeLocation ||
    !node.Outer
  ) {
    continue;
  }

  let group = "locations";
  let size = 2;
  let icon = "";
  let type: string;
  let isStatic: boolean = false;
  let id = "";
  if (node.Outer.startsWith("BP_DungeonPortalMarker_")) {
    type = "dungeon_random";
  } else if (node.Outer.startsWith("BP_DungeonFixedEntrance")) {
    type = "dungeon_sealed";
  } else if (
    node.Outer.startsWith("BP_LevelObject_StaticRespawnPoint") ||
    node.Outer.startsWith("BP_MapObject_StaticRespawnPoint")
  ) {
    type = "respawn_point";
    enDict["respawn_point"] = "Respawn Point";
    icon = await saveIcon(
      "/Pal/Content/Pal/Blueprint/UI/WorldMap/IconWidgets/testIcon/T_worldmap_icon_fasttravel.png",
      type,
    );
    size = 3;
    const parent = mainWorld.find((n) => n.Name === node.Outer);
    if (!parent || !parent.Properties?.RespawnPointID) {
      throw new Error(`No parent for ${node.Outer}`);
    }
    id = parent.Properties.RespawnPointID;
    const name =
      mapRespawnPointInfoText[0].Rows[`${id}_Title`].TextData.LocalizedString;
    const desc = mapRespawnPointInfoText[0].Rows[id].TextData.LocalizedString;
    enDict[id] = name;
    enDict[`${id}_desc`] = desc;
  } else if (
    node.Outer.startsWith("BP_LevelObject_TowerFastTravelPoint") ||
    node.Outer.startsWith("BP_MapObject_TowerFastTravelPoint")
  ) {
    type = "fasttravel";
    const parent = mainWorld.find((n) => n.Name === node.Outer);
    if (!parent || !parent.Properties?.FastTravelPointID) {
      throw new Error(`No parent for ${node.Outer}`);
    }
    id = parent.Properties.FastTravelPointID;
    const name = mapRespawnPointInfoText[0].Rows[id].TextData.LocalizedString;
    if (["FTPoint66"].includes(id) || name === "en Text") {
      continue;
    }
    enDict[id] = name;
  } else if (node.Outer.startsWith("BP_PalBossTower_")) {
    type = "boss_tower";
    const parent = mainWorld.find((n) => n.Name === node.Outer);
    if (!parent || !parent.Properties?.BossType) {
      throw new Error(`No parent for ${node.Outer}`);
    }
    id = parent.Properties.BossType.replace("EPalBossType::", "");
    const name =
      uiCommonText[0].Rows[`BOSS_BATTLE_NAME_${id}`].TextData.LocalizedString;
    enDict[id] = name;
  } else if (node.Outer.startsWith("BP_LevelObject_GoddessStatue")) {
    type = "goddess_statue";
  } else if (
    node.Outer.startsWith("BP_RelicObject") ||
    node.Outer.startsWith("BP_LevelObject_Relic")
  ) {
    type = "lifmunk_effigy";
    group = "collectibles";
  } else if (node.Outer.startsWith("BP_PalMapObjectSpawner_SkillFruits")) {
    type = "skill_fruit";
    group = "items";
  } else if (node.Outer.startsWith("BP_PalMapObjectSpawner_Treasure")) {
    type = "treasure_box";
    group = "items";
    // } else if (node.Outer.startsWith("bp_palmapobjectspawner_palegg_")) {
    //   const region = node.Outer.split("_")[3].toLowerCase();
    //   if (region === "volcanic") {
    //     type = "egg_fire";
    //   } else if (region === "sakurajima") {
    //     type = "egg_dragon";
    //     // } else if (region === "desert") {
    //     //   type = "egg_dark";
    //   } else {
    //     console.log(region);
    //     type = "egg_common";
    //   }
  } else {
    continue;
  }
  const bp = node.Outer.split("_C")[0] + "_C";
  if (
    !bp.startsWith("BP_PalMapObjectSpawner") ||
    bp.startsWith("BP_PalMapObjectSpawner_SkillFruits")
  ) {
    typesIDs[bp] = type;
  }
  if (!newNodes.some((n) => n.type === type)) {
    const nodeDef: Node = {
      type,
      spawns: [],
    };
    if (isStatic) {
      nodeDef.static = true;
    }
    newNodes.push(nodeDef);
  }
  const nodesSpawns = newNodes.find((n) => n.type === type)!;

  const spawn: Node["spawns"][0] = {
    p: [node.Properties.RelativeLocation.X, node.Properties.RelativeLocation.Y],
  };
  if (id) {
    spawn.id = id;
  }
  nodesSpawns.spawns.push(spawn);

  if (!filters.find((f) => f.group === group)) {
    filters.push({
      group: group,
      values: [],
    });
  }
  const category = filters.find((f) => f.group === group)!;
  if (!category.values.some((v) => v.id === type)) {
    category.values.push({
      id: type,
      icon,
      size,
    });
  }
}

const PAL_OFFSET = 2500;
const existingLocations: [number, number][] = [];
for (const [id, data] of Object.entries(palxdexDistributionData[0].Rows)) {
  const type = id.toLowerCase();
  const baseType = id.replace("BOSS_", "").replace("_Flower", "").toLowerCase();
  if (!newNodes.some((n) => n.type === type)) {
    const nodeDef: Node = {
      type,
      spawns: [],
    };
    newNodes.push(nodeDef);
    const pal = palMonsterParameter[0].Rows[id];
    if (!pal) {
      throw new Error(`No pal data for ${id}`);
    }
    const icon = Object.entries(palCharacterIconDataTable[0].Rows).find(
      (t) => t[0].toLocaleLowerCase() === baseType,
    );
    if (!icon) {
      throw new Error(`No icon data for ${baseType}`);
    }
    const group = type.startsWith("boss_") ? "pal_alpha" : "pal_common";
    if (!filters.find((f) => f.group === group)) {
      filters.push({
        group: group,
        values: [],
      });
    }
    const category = filters.find((f) => f.group === group)!;
    if (!category.values.some((v) => v.id === type)) {
      category.values.push({
        id: type,
        icon: await saveIcon(
          icon[1].Icon.AssetPathName.replace("/Game", "/Pal/Content").split(
            ".",
          )[0] + ".png",
          type,
          {
            border: true,
            color: group === "pal_alpha" ? "#ff5670" : "#aaa",
          },
        ),
        size: group === "pal_alpha" ? 2 : 1.3,
      });
    }

    const textId =
      pal.OverrideNameTextId === "None"
        ? `PAL_NAME_${id}`
        : pal.OverrideNameTextId;
    const text = Object.entries(palNameText[0].Rows).find(
      (t) => t[0].toLocaleLowerCase() === textId.toLowerCase(),
    );
    if (!text) {
      throw new Error(`No text data for ${textId}`);
    }
    enDict[type] = text[1].TextData.LocalizedString;
    const descId = textId.replace("PAL_NAME_", "PAL_LONG_DESC_");
    const desc = Object.entries(palLongDescriptionText[0].Rows).find(
      (t) => t[0].toLocaleLowerCase() === descId.toLowerCase(),
    );
    if (!desc) {
      throw new Error(`No description data for ${descId}`);
    }
    enDict[`${type}_desc`] = desc[1].TextData.LocalizedString;
    typesIDs[`BP_${pal.BPClass}_C`] = type;
  }
  const category = newNodes.find((n) => n.type === type)!;
  const locations = [
    ...data.dayTimeLocations.locations,
    ...data.nightTimeLocations.locations.filter(
      (loc) =>
        !data.dayTimeLocations.locations.some(
          (s) => s.X === loc.X && s.Y === loc.Y,
        ),
    ),
  ];
  const radius = Math.max(
    data.dayTimeLocations.Radius,
    data.nightTimeLocations.Radius,
  );
  const clusters: [number, number][][] = [];
  locations.forEach((loc) => {
    let x = loc.X;
    let y = loc.Y;

    let clusterFound = false;
    for (const cluster of clusters) {
      const [cx, cy] = cluster[0];
      const distance = calculateDistance([x, y], [cx, cy]);
      if (distance <= radius) {
        cluster.push([x, y]);
        clusterFound = true;
        break;
      }
    }
    if (!clusterFound) {
      clusters.push([[x, y]]);
    }
  });

  clusters.forEach((cluster) => {
    const clusterX = cluster.reduce((sum, [x]) => sum + x, 0) / cluster.length;
    const clusterY =
      cluster.reduce((sum, [, y]) => sum + y, 0) / cluster.length;
    let offsetX = 0;
    let offsetY = 0;
    let x = clusterX;
    let y = clusterY;
    let radius = PAL_OFFSET;
    let i = 0;
    let total = 6;
    while (existingLocations.some((l) => l[0] === x && l[1] === y)) {
      const angle = (i / total) * 2 * Math.PI;
      offsetX = radius * Math.cos(angle);
      offsetY = radius * Math.sin(angle);
      x = clusterX + offsetX;
      y = clusterY + offsetY;
      i++;
      if (i % total === 0) {
        radius += PAL_OFFSET;
        i = 0;
        total += 6;
      }
    }

    existingLocations.push([x, y]);
    const spawn: Node["spawns"][0] = {
      p: [x, y],
    };
    category.spawns.push(spawn);
  });
}

const nodes = oldNodes.map((n) => {
  const newNodeType = newNodes.find((nn) => nn.type === n.type);
  if (newNodeType) {
    return newNodeType;
  }
  return n;
});
newNodes.forEach((n) => {
  if (!nodes.some((node) => node.type === n.type)) {
    nodes.push(n);
  }
});
writeNodes(nodes);
writeDict(enDict, "en");
writeTypesIDs(typesIDs);
writeFilters(filters);

export type DT_PaldexDistributionData = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    RowStruct: {
      ObjectName: string;
      ObjectPath: string;
    };
  };
  Rows: {
    [id: string]: {
      dayTimeLocations: {
        locations: Array<{
          X: number;
          Y: number;
          Z: number;
        }>;
        Radius: number;
      };
      nightTimeLocations: {
        locations: Array<{
          X: number;
          Y: number;
          Z: number;
        }>;
        Radius: number;
      };
    };
  };
}>;

export type DT_PalNameText = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    RowStruct: {
      ObjectName: string;
      ObjectPath: string;
    };
  };
  Rows: {
    [key: string]: {
      TextData: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
    };
  };
}>;

export type DT_PalLongDescriptionText = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    RowStruct: {
      ObjectName: string;
      ObjectPath: string;
    };
  };
  Rows: {
    [key: string]: {
      TextData: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
    };
  };
}>;

export type DT_PalMonsterParameter = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    RowStruct: {
      ObjectName: string;
      ObjectPath: string;
    };
  };
  Rows: {
    [key: string]: {
      OverrideNameTextId: string;
      NamePrefixID: string;
      OverridePartnerSkillTextID: string;
      IsPal: boolean;
      Tribe: string;
      BPClass: string;
      ZukanIndex: number;
      ZukanIndexSuffix: string;
      Size: string;
      Rarity: number;
      ElementType1: string;
      ElementType2: string;
      GenusCategory: string;
      Organization: string;
      Weapon: string;
      WeaponEquip: boolean;
      HP: number;
      MeleeAttack: number;
      ShotAttack: number;
      Defense: number;
      Support: number;
      CraftSpeed: number;
      EnemyMaxHPRate: number;
      EnemyReceiveDamageRate: number;
      EnemyInflictDamageRate: number;
      CaptureRateCorrect: number;
      ExpRatio: number;
      Price: number;
      StatusResistUpRate: number;
      AIResponse: string;
      AISightResponse: string;
      SlowWalkSpeed: number;
      WalkSpeed: number;
      RunSpeed: number;
      RideSprintSpeed: number;
      TransportSpeed: number;
      IsBoss: boolean;
      IsTowerBoss: boolean;
      IsRaidBoss: boolean;
      UseBossHPGauge: boolean;
      BattleBGM: string;
      IgnoreLeanBack: boolean;
      IgnoreBlowAway: boolean;
      MaxFullStomach: number;
      FullStomachDecreaseRate: number;
      FoodAmount: number;
      ViewingDistance: number;
      ViewingAngle: number;
      HearingRate: number;
      NooseTrap: boolean;
      Nocturnal: boolean;
      BiologicalGrade: number;
      Predator: boolean;
      Edible: boolean;
      Stamina: number;
      MaleProbability: number;
      CombiRank: number;
      WorkSuitability_EmitFlame: number;
      WorkSuitability_Watering: number;
      WorkSuitability_Seeding: number;
      WorkSuitability_GenerateElectricity: number;
      WorkSuitability_Handcraft: number;
      WorkSuitability_Collection: number;
      WorkSuitability_Deforest: number;
      WorkSuitability_Mining: number;
      WorkSuitability_OilExtraction: number;
      WorkSuitability_ProductMedicine: number;
      WorkSuitability_Cool: number;
      WorkSuitability_Transport: number;
      WorkSuitability_MonsterFarm: number;
      PassiveSkill1: string;
      PassiveSkill2: string;
      PassiveSkill3: string;
      PassiveSkill4: string;
    };
  };
}>;

export type DT_PalCharacterIconDataTable = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    RowStruct: {
      ObjectName: string;
      ObjectPath: string;
    };
  };
  Rows: {
    [key: string]: {
      Icon: {
        AssetPathName: string;
        SubPathString: string;
      };
    };
  };
}>;

export type PL_MainWorld5 = Array<{
  Type: string;
  Name: string;
  Outer?: string;
  Class: string;
  Properties?: {
    PalSoundPlayer?: {
      ObjectName: string;
      ObjectPath: string;
    };
    PalLimitVolumeBox?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Glow?: {
      ObjectName: string;
      ObjectPath: string;
    };
    WarpPoint?: {
      ObjectName: string;
      ObjectPath: string;
    };
    IndicatorOrigin?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_InteractableBox?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Mesh?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BuildWorkableBounds?: {
      ObjectName: string;
      ObjectPath: string;
    };
    CheckOverlapCollision?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Root?: {
      ObjectName: string;
      ObjectPath: string;
    };
    FastTravelPointID?: string;
    BossType?: string;
    LevelObjectInstanceId?: string;
    RootComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BlueprintCreatedComponents?: Array<
      | {
          ObjectName: string;
          ObjectPath: string;
        }
      | undefined
    >;
    RespawnPointID?: string;
    MaterialBillboard?: {
      ObjectName: string;
      ObjectPath: string;
    };
    ObtainFXOrigin?: {
      ObjectName: string;
      ObjectPath: string;
    };
    StaticMesh_Base?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AuraEffect?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_InteractableSphere?: {
      ObjectName: string;
      ObjectPath: string;
    };
    StaticMesh_Gem?: {
      ObjectName: string;
      ObjectPath: string;
    };
    DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SkeletalMesh?: {
      ObjectName: string;
      ObjectPath: string;
    };
    NoteRowName?: {
      Key: string;
    };
    NS_GoddessStatue_Glow?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_InteractableCapsule?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AttachParent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    UCSSerializationIndex?: number;
    bNetAddressable?: boolean;
    CreationMethod?: string;
    OnComponentBeginOverlap?: {
      InvocationList: Array<{
        Object: {
          ObjectName: string;
          ObjectPath: string;
        };
        FunctionName: string;
      }>;
    };
    OnComponentEndOverlap?: {
      InvocationList: Array<{
        Object: {
          ObjectName: string;
          ObjectPath: string;
        };
        FunctionName: string;
      }>;
    };
    HeatLevel_DayTime?: number;
    HeatLevel_NightTime?: number;
    BoxExtent?: {
      X: number;
      Y: number;
      Z: number;
    };
    RelativeLocation?: {
      X: number;
      Y: number;
      Z: number;
    };
    RelativeRotation?: {
      Pitch: number;
      Yaw: number;
      Roll: number;
    };
    BottomLayer?: {
      ObjectName: string;
      ObjectPath: string;
    };
    UnlitOpaque?: {
      ObjectName: string;
      ObjectPath: string;
    };
    LitOpaque?: {
      ObjectName: string;
      ObjectPath: string;
    };
    UnlitTranslucent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    LitTranlucent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    LitMasked?: {
      ObjectName: string;
      ObjectPath: string;
    };
    UnlitMasked?: {
      ObjectName: string;
      ObjectPath: string;
    };
    StaticMeshComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    bEnableAutoLODGeneration?: boolean;
    StaticMesh: any;
    EditSpawnParameter?: {
      RespawnProbability: number;
    };
    bEditSpawnParameter?: boolean;
    SpawnAreaIds?: Array<{
      Key: string;
    }>;
    Niagara?: {
      ObjectName: string;
      ObjectPath: string;
    };
    DeadItemDropPoint?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Scene?: {
      ObjectName: string;
      ObjectPath: string;
    };
    DataLayerAsset?: {
      ObjectName: string;
      ObjectPath: string;
    };
    EnemySpawnerSoftClass?: {
      AssetPathName: string;
      SubPathString: string;
    };
    RespawnCoolTimeMinutesAfterBossDefeated?: number;
    DungeonNameRowHandle?: {
      RowName: string;
    };
    Box?: {
      ObjectName: string;
      ObjectPath: string;
    };
    RelatedDataLayerAsset?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BoxBrush?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SceneComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    EasySelectBillboard?: {
      ObjectName: string;
      ObjectPath: string;
    };
    RandomStream?: {
      InitialSeed?: number;
      Seed: number;
    };
    PlacementItems?: Array<{
      ItemType: string;
      Actor: {
        ObjectName: string;
        ObjectPath: string;
      };
      Mesh: any;
      Weight: number;
    }>;
    Amount?: number;
    Seed?: number;
    PlacementStyle?: string;
    bGenerateOverlapEvents?: boolean;
    RelativeScale3D?: {
      X: number;
      Y: number;
      Z: number;
    };
    bCanEverAffectNavigation?: boolean;
    AreaClassOverride?: {
      ObjectName: string;
      ObjectPath: string;
    };
    bUseSystemDefaultObstacleAreaClass?: boolean;
    BodyInstance?: {
      MaxAngularVelocity?: number;
      ObjectType?: string;
      CollisionProfileName?: string;
      CollisionResponses?: {
        ResponseArray: Array<{
          Channel: string;
          Response: string;
        }>;
      };
      bEnableGravity?: boolean;
    };
    LineThickness?: number;
    bVisibleInReflectionCaptures?: boolean;
    bVisibleInRealTimeSkyCaptures?: boolean;
    bVisibleInRayTracing?: boolean;
    bHiddenInSceneCapture?: boolean;
    CanCharacterStepUpOn?: string;
    Location?: {
      X: number;
      Y: number;
      Z: number;
    };
    Rotation?: {
      Pitch: number;
      Yaw: number;
      Roll: number;
    };
    DefaultInstance?: {
      ObjectType: string;
      CollisionEnabled?: string;
      CollisionProfileName: string;
      CollisionResponses: {
        ResponseArray: Array<{
          Channel: string;
          Response: string;
        }>;
      };
    };
    CollisionTraceFlag?: string;
    AggGeom?: {
      ConvexElems: Array<{
        VertexData: Array<{
          X: number;
          Y: number;
          Z: number;
        }>;
        IndexData: Array<number>;
        ElemBox: {
          Min: {
            X: number;
            Y: number;
            Z: number;
          };
          Max: {
            X: number;
            Y: number;
            Z: number;
          };
          IsValid: number;
        };
        Transform: {
          Rotation: {
            X: number;
            Y: number;
            Z: number;
            W: number;
            IsNormalized: boolean;
            Size: number;
            SizeSquared: number;
          };
          Translation: {
            X: number;
            Y: number;
            Z: number;
          };
          Scale3D: {
            X: number;
            Y: number;
            Z: number;
          };
        };
        RestOffset: number;
        Name: string;
        bContributeToMass: boolean;
        CollisionEnabled: string;
      }>;
    };
    bGenerateMirroredCollision?: boolean;
    PhysicsType?: string;
    StopWhenOwnerDestroyed?: boolean;
  };
  Template?: {
    ObjectName: string;
    ObjectPath: string;
  };
  SuperStruct?: {
    ObjectName: string;
    ObjectPath: string;
  };
  ChildProperties?: Array<{
    Type: string;
    Name: string;
    Flags: string;
    ElementSize: number;
    PropertyFlags: string;
    Struct: {
      ObjectName: string;
      ObjectPath: string;
    };
  }>;
  ClassFlags?: string;
  ClassWithin?: {
    ObjectName: string;
    ObjectPath: string;
  };
  ClassConfigName?: string;
  bCooked?: boolean;
  ClassDefaultObject?: {
    ObjectName: string;
    ObjectPath: string;
  };
  EditorTags?: {
    BlueprintType: string;
  };
  BodySetupGuid?: string;
  CookedFormatData?: {
    PhysXPC: {
      BulkDataFlags: string;
      ElementCount: number;
      SizeOnDisk: number;
      OffsetInFile: string;
    };
  };
}>;

export type DT_MapRespawnPointInfoText = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    RowStruct: {
      ObjectName: string;
      ObjectPath: string;
    };
  };
  Rows: {
    [key: string]: {
      TextData: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
    };
  };
}>;

export type DT_UI_Common_Text = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    RowStruct: {
      ObjectName: string;
      ObjectPath: string;
    };
  };
  Rows: {
    [key: string]: {
      TextData: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
    };
  };
}>;
