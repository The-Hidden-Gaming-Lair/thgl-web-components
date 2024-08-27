import { $ } from "bun";
import {
  readDirRecursive,
  readDirSync,
  readJSON,
  saveImage,
  writeJSON,
} from "./lib/fs.js";
import {
  MAchievementData,
  MBoxItemData,
  MDungeonStageData,
  MEquipmentItemData,
  MMaterialItemData,
  MNpcData,
  MNpcRoleData,
  MNpcSpawnData,
  MPrivateMissionData,
  MStringData,
  MSubZoneData,
  MWorldFieldData,
  MZoneExportData,
  MZonePersistentData,
  MZoneResourceData,
  MZoneResourceExportData,
  MinimapDataAsset,
  UIDataAsset,
  ZoneMapIconWidget,
} from "./types.js";
import { addCircleToImage } from "./lib/image.js";

const CONTENT_DIR = "/mnt/c/dev/Night Crows/Extracted/Data";
const TEXTURE_DIR = "/mnt/c/dev/Night Crows/Extracted/Texture";
const TEMP_DIR =
  "/home/devleon/the-hidden-gaming-lair/services/night-crows-data/out";
const OUT_DIR = "/home/devleon/the-hidden-gaming-lair/static/night-crows";
const savedIcons: string[] = [];

const mSubZoneData = readJSON<MSubZoneData>(
  `${CONTENT_DIR}/mad/content/gamedata/msubzonedata.json`,
);
const subZoneData = mSubZoneData[0].Rows;
const mZoneResourceExportData = readJSON<MZoneResourceExportData>(
  `${CONTENT_DIR}/mad/content/gamedata/mzoneresourceexportdata.json`,
);
const zoneResources = mZoneResourceExportData[0].Rows;
const mStringData = readJSON<MStringData>(
  `${CONTENT_DIR}/mad/content/gamedata/mstringdata.json`,
);
const stringData = mStringData[0].Rows;
const uiDataAsset = readJSON<UIDataAsset>(
  `${CONTENT_DIR}/mad/content/uniquedataasset/uidataasset.json`,
);
const uiData = uiDataAsset[0];
const zoneMapIconWidget = readJSON<ZoneMapIconWidget>(
  `${CONTENT_DIR}/mad/content/ui/bp/zonemap/icon/zonemapiconwidget.json`,
);
const mZoneResourceData = readJSON<MZoneResourceData>(
  `${CONTENT_DIR}/mad/content/gamedata/mzoneresourcedata.json`,
);
const zoneResourceData = mZoneResourceData[0].Rows;
const mZonePersistentData = readJSON<MZonePersistentData>(
  `${CONTENT_DIR}/mad/content/gamedata/mzonepersistentdata.json`,
);
const zonePersistentData = mZonePersistentData[0].Rows;
const mZoneExportData = readJSON<MZoneExportData>(
  `${CONTENT_DIR}/mad/content/gamedata/mzoneexportdata.json`,
);
const zoneExportData = mZoneExportData[0].Rows;
const mNpcData = readJSON<MNpcData>(
  `${CONTENT_DIR}/mad/content/gamedata/mnpcdata.json`,
);
const npcData = mNpcData[0].Rows;
const npcEntries = Object.entries(npcData);
const mNpcRoleData = readJSON<MNpcRoleData>(
  `${CONTENT_DIR}/mad/content/gamedata/mnpcroledata.json`,
);
const npcRoleData = mNpcRoleData[0].Rows;
const mNpcSpawnData = readJSON<MNpcSpawnData>(
  `${CONTENT_DIR}/mad/content/gamedata/mnpcspawndata.json`,
);
const npcSpawnData = mNpcSpawnData[0].Rows;
const mPrivateMissionData = readJSON<MPrivateMissionData>(
  `${CONTENT_DIR}/mad/content/gamedata/mprivatemissiondata.json`,
);
const privateMissionData = mPrivateMissionData[0].Rows;
const mAchievementData = readJSON<MAchievementData>(
  `${CONTENT_DIR}/mad/content/gamedata/machievementdata.json`,
);
const achievementData = mAchievementData[0].Rows;
const mMaterialItemData = readJSON<MMaterialItemData>(
  `${CONTENT_DIR}/mad/content/gamedata/mmaterialitemdata.json`,
);
const materialItemData = mMaterialItemData[0].Rows;
const mEquipmentItemData = readJSON<MEquipmentItemData>(
  `${CONTENT_DIR}/mad/content/gamedata/mequipmentitemdata.json`,
);
const equipmentItemData = mEquipmentItemData[0].Rows;
const mBoxItemData = readJSON<MBoxItemData>(
  `${CONTENT_DIR}/mad/content/gamedata/mboxitemdata.json`,
);
const boxItemData = mBoxItemData[0].Rows;
const mDungeonStageData = readJSON<MDungeonStageData>(
  `${CONTENT_DIR}/mad/content/gamedata/mdungeonstagedata.json`,
);
const dungeonStageData = mDungeonStageData[0].Rows;
const mWorldFieldData = readJSON<MWorldFieldData>(
  `${CONTENT_DIR}/mad/content/gamedata/mworldfielddata.json`,
);
const worldFieldData = mWorldFieldData[0].Rows;

const zonesIDs = Object.keys(zoneResourceData)
  .map((z) => z.replace("_Special", ""))
  .sort((a, b) => b.length - a.length);

const icons: Record<string, string> = {};
for (const zoneMapIcon of zoneMapIconWidget) {
  if (zoneMapIcon.Type !== "MImage") {
    continue;
  }
  const path = await saveIcon(
    `${TEXTURE_DIR}/${zoneMapIcon.Properties.Brush!.ResourceObject.ObjectPath.replace(
      ".0",
      ".png",
    )}`,
  );
  icons[zoneMapIcon.Name] = path;
}
const bookmarkIconPath = await saveIcon(
  `${TEXTURE_DIR}/mad/content/ui/tex/icon/ui_texture_icon_bookmark.png`,
);
icons["EPrivateMissionType::Move"] = bookmarkIconPath;

const nodes: {
  type: string;
  mapName: string;
  spawns: { id?: string; p: [number, number] }[];
}[] = [];
const filters: {
  group: string;
  defaultOpen?: boolean;
  defaultOn?: boolean;
  values: {
    id: string;
    icon: string;
    size?: number;
    live_only?: boolean;
  }[];
}[] = [];
const locations: (typeof filters)[0] = {
  group: "locations",
  defaultOpen: true,
  defaultOn: true,
  values: [],
};
const missions: (typeof filters)[0] = {
  group: "missions",
  defaultOpen: true,
  defaultOn: true,
  values: [],
};
const enDict: Record<string, string> = {
  locations: "Locations",
  monsters: "Monsters",
  npcs: "NPCs",
  missions: "Missions",
  "EPrivateMissionType::Move": "Taylor's Crow",
  "ESubzoneType::Airship": "Airfield",
  "ESubzoneType::DungeonEntry": "Dungeon",
  "ESubzoneType::HuntingGround": "Hunting Ground",
  "ESubzoneType::Town": "Town",
  "ESubzoneType::Invisible": "Grounds",
};

for (const zone of Object.values(zoneResources)) {
  for (const area of zone.Areas) {
    const subZone = Object.values(subZoneData).find(
      (subZone) =>
        subZone.Zone.StringId === zone.ZoneResourceId.StringId &&
        subZone.IconArea === area.Key,
      // subZone.Areas.includes(area.Key)
    );
    const [missionKey, privateMission] = Object.entries(
      privateMissionData,
    ).find(([, m]) => m.DestinationArea === area.Key) || [null, null];
    const achievement = missionKey ? achievementData[missionKey] : null;
    if (!subZone && !privateMission) {
      continue;
    }

    const titleStringId = (subZone?.Title.StringId ||
      achievement?.Title.StringId ||
      privateMission?.Title.StringId)!;
    const descStringId = privateMission?.Title.StringId;
    const zoneTitle = stringData[titleStringId].English.LocalizedString;
    // "Type": "EAreaType::Circle", "Type": "EAreaType::Polygon",

    const type = subZone?.Type || privateMission?.Type!;
    let icon = "";
    if (subZone && subZone.Icon.AssetPathName !== "None") {
      icon = await saveIcon(
        `${TEXTURE_DIR}${
          subZone.Icon.AssetPathName!.toLowerCase()
            .replace("/game", "/mad/content")
            .split(".")[0]
        }.png`,
      );
    } else {
      switch (type) {
        case "ESubzoneType::Town":
          icon = icons["TownIcon"];
          break;
        case "ESubzoneType::DungeonEntry":
          icon = icons["DungeonIcon"];
          break;
        case "ESubzoneType::HuntingGround":
          icon = icons["HuntingIcon"];
          break;
        case "ESubzoneType::Airship":
          icon = icons["OverrideIcon"];
          break;
        case "ESubzoneType::Invisible":
          icon = icons["OverrideIcon"];
          break;
        case "EPrivateMissionType::Move":
          icon = icons["EPrivateMissionType::Move"];
          break;
      }
    }
    const target = subZone ? locations : missions;
    if (!target.values.some((v) => v.id === type)) {
      target.values.push({
        id: type,
        icon,
        size: 2.5,
      });
    }
    const mapName =
      zoneResourceData[zone.ZoneResourceId.StringId].Persistent.StringId;
    const zoneMapName = zone.ZoneResourceId.StringId.replace("_Special", "");
    if (!nodes.some((n) => n.type === type && n.mapName === zoneMapName)) {
      nodes.push({
        type: type,
        mapName: zoneMapName,
        spawns: [],
      });
    }
    const category = nodes.find(
      (n) => n.type === type && n.mapName === zoneMapName,
    )!;

    const zoneData = zonePersistentData[mapName];

    if (mapName.startsWith("ContentTest") || zoneData.Disable) {
      continue;
    }
    const spawn: (typeof nodes)[number]["spawns"][number] = {
      id: area.Key,
      p: [area.Position.Y, area.Position.X] as [number, number],
    };
    category.spawns.push(spawn);
    enDict[area.Key] = zoneTitle;
    if (descStringId) {
      enDict[`${area.Key}_desc`] =
        stringData[descStringId].English.LocalizedString;
    }
    if (subZone?.Recommendation.RecommendedPcLevel) {
      enDict[`${area.Key}_desc`] =
        `<b>Recommendation:</b><br>Level: ${subZone.Recommendation.RecommendedPcLevel}<br>Accuracy: ${subZone.Recommendation.Accuracy.Min}-${subZone.Recommendation.Accuracy.Max}<br>Armor: ${subZone.Recommendation.Armor.Min}-${subZone.Recommendation.Armor.Max}`;
    }
  }
}

filters.push(locations);
filters.push(missions);

const monsters: (typeof filters)[number] = {
  group: "monsters",
  defaultOpen: true,
  defaultOn: true,
  values: [],
};
const npcs: (typeof filters)[number] = {
  group: "npcs",
  defaultOpen: true,
  defaultOn: true,
  values: [],
};
for (const exportData of Object.values(zoneExportData)) {
  const processNPC = async (
    id: string,
    npc: MNpcData["0"]["Rows"]["0"],
    zoneName: string,
    spawnId: number,
    spawnNum: number,
  ) => {
    let role: string = npc.NpcRole.StringId;
    if (role === "None") {
      role = npc.Type.split("::")[1];
    }
    const roleData = npcRoleData[role];

    let icon = "";
    if (!roleData) {
      let resource = uiData.Properties[`${role}Brush`];
      if (role === "NormalMonster") {
        resource = uiData.Properties["NeutralPcBrush"];
      }
      if (!resource) {
        console.warn("Missing brush for", role);
        return;
      }
      let color;
      if (role === "NamedMonster") {
        if (id.includes("CentaurusKnight")) {
          role = "Kiaron";
          color = "#0066ff";
        } else if (id.includes("Ork")) {
          role = "Grish";
          color = "#cbcb41";
        } else if (id.includes("ThornSpider")) {
          role = "Anggolt";
          color = "#ffffff";
        } else if (id.includes("GolemFlame")) {
          role = "Inferno";
          color = "#ff0000";
        } else if (id.includes("SkeletonWarrior")) {
          role = "Skeleton";
          color = "#0000ff";
        } else if (id.includes("KnightsCommander")) {
          role = "Templar";
          color = "#00ff00";
        } else {
          throw new Error(`Missing color for ${id}`);
        }
      }
      if (color) {
        const canvas = await addCircleToImage(
          `${TEXTURE_DIR}/${resource.ResourceObject.ObjectPath.replace(".0", ".png")}`,
          color,
        );
        saveImage(TEMP_DIR + `/${id}.png`, canvas.toBuffer("image/png"));
        icon = await saveIcon(`${TEMP_DIR}/${id}.png`);
      } else {
        icon = await saveIcon(
          `${TEXTURE_DIR}/${resource.ResourceObject.ObjectPath.replace(".0", ".png")}`,
        );
      }
    } else {
      icon = await saveIcon(
        `${TEXTURE_DIR}${
          roleData.Icon.AssetPathName!.toLowerCase()
            .replace("/game", "/mad/content")
            .split(".")[0]
        }.png`,
      );
    }
    let mapName = "";
    if (npc.Subzone.StringId === "None") {
      const zoneId = zonesIDs.find((zoneId) => zoneName.startsWith(zoneId));
      if (!zoneId) {
        console.warn("Missing zone data for", zoneName);
        return;
      }
      mapName = zoneId;
    } else {
      const subZone = subZoneData[npc.Subzone.StringId];
      mapName = subZone.Zone.StringId;
    }
    mapName = mapName.replace("_Special", "");

    let target;
    enDict[id] = stringData[npc.Title.StringId].English.LocalizedString;
    if (npc.Faction.StringId === "Monster" || id.includes("Boss")) {
      target = monsters;
      enDict[`${id}_desc`] = "";
      if (id.includes("_R1_")) {
        enDict[`${id}_desc`] = "<b>Realm</b>: Rook<br>";
      } else if (id.includes("_R2_")) {
        enDict[`${id}_desc`] = "<b>Realm</b>: Bishop<br>";
      } else if (id.includes("_R3_")) {
        enDict[`${id}_desc`] = "<b>Realm</b>: Knight<br>";
      }
      if (npc.Subtitle.StringId !== "None") {
        enDict[`${id}_desc`] +=
          `${stringData[npc.Subtitle.StringId].English.LocalizedString}<br><b>${stringData["Str_UI_ZoneMap_MonsterLevel"].English.LocalizedString}</b>: ${npc.Level}`;
      } else {
        enDict[`${id}_desc`] +=
          `<b>${stringData["Str_UI_ZoneMap_MonsterLevel"].English.LocalizedString}</b>: ${npc.Level}`;
      }
      enDict[`${id}_desc`] +=
        `<br><b>HP Bars</b>: ${npc.TargetInfoHpBarLineCount}`;
    } else {
      target = npcs;
    }

    const spawnData = Object.values(npcSpawnData).find(
      (spawn) => spawn.ID === spawnId,
    );
    if (spawnData && spawnData.Spawn.Type !== "ESpawnType::Once") {
      if (!enDict[`${id}_desc`]) {
        enDict[`${id}_desc`] = "";
      } else {
        enDict[`${id}_desc`] += "<br>";
      }
      enDict[`${id}_desc`] +=
        `<b>Spawn Count</b>: ${spawnNum}<br><b>Respawn Interval</b>: ${formatTimer(spawnData.Spawn.TimeInfo.IntervalSec)}`;
      if (spawnData.Spawn.TimeInfo.RandomDelaySec) {
        enDict[`${id}_desc`] +=
          `<br><b>Random Respawn Delay</b>: ${formatTimer(spawnData.Spawn.TimeInfo.RandomDelaySec)}`;
      }
    }
    let size = 1.5;
    if (role === "NormalMonster") {
      size = 0.8;
    }
    if (role.startsWith("WorldCoinStore")) {
      role = "WorldCoinStore";
    }

    if (!target.values.some((v) => v.id === role)) {
      target.values.push({
        id: role,
        icon,
        size: size,
      });
    }

    if (!nodes.some((n) => n.type === role && n.mapName === mapName)) {
      nodes.push({
        type: role,
        mapName,
        spawns: [],
      });
    }
    if (!roleData) {
      if (role === "NormalMonster") {
        enDict[role] = "Common";
      } else if (role === "BossMonster") {
        enDict[role] = "Boss";
      } else {
        enDict[role] = role
          .replace(/([A-Z][a-z])/g, " $1")
          .replace(/(\d)/g, " $1")
          .trim();
      }
    } else {
      enDict[role] =
        stringData[roleData.Title.StringId].English.LocalizedString;
    }
    return { mapName, role };
  };
  for (const npcSpawnSpot of exportData.NpcSpawnSpots) {
    if (npcSpawnSpot.Name.startsWith("ContentTest")) {
      continue;
    }

    const npcEntry = npcEntries.find(
      ([, npc]) => npc.ID === npcSpawnSpot.NpcSpawnCommon.NpcId,
    );
    if (!npcEntry) {
      console.warn("Missing npc data for", npcSpawnSpot.NpcSpawnCommon.NpcId);
      continue;
    }
    const [id, npc] = npcEntry;

    const result = await processNPC(
      id,
      npc,
      npcSpawnSpot.Name,
      npcSpawnSpot.NpcSpawnCommon.NpcSpawnId,
      npcSpawnSpot.NpcSpawnCommon.NpcSpawnNum,
    );
    if (!result) {
      continue;
    }
    const { mapName, role } = result;
    const category = nodes.find(
      (n) => n.type === role && n.mapName === mapName,
    )!;
    const spawn: (typeof nodes)[number]["spawns"][number] = {
      id,
      p: [
        npcSpawnSpot.SpotCommon.Position.Y,
        npcSpawnSpot.SpotCommon.Position.X,
      ] as [number, number],
    };
    if (
      category.spawns.some(
        (s) =>
          s.id === spawn.id && s.p[0] === spawn.p[0] && s.p[1] === spawn.p[1],
      )
    ) {
      continue;
    }
    category.spawns.push(spawn);
  }

  for (const npcRandomSpawnSpot of exportData.NpcRandomSpawnAreas) {
    if (npcRandomSpawnSpot.Name.startsWith("ContentTest")) {
      continue;
    }
    let spawnIndex = 0;
    for (const npcSpawnSpot of npcRandomSpawnSpot.NpcSpawn) {
      const npcEntry = npcEntries.find(
        ([, npc]) => npc.ID === npcSpawnSpot.NpcSpawnCommon.NpcId,
      );
      if (!npcEntry) {
        console.warn("Missing npc data for", npcSpawnSpot.NpcSpawnCommon.NpcId);
        continue;
      }

      const [id, npc] = npcEntry;
      const result = await processNPC(
        id,
        npc,
        npcRandomSpawnSpot.Name,
        npcSpawnSpot.NpcSpawnCommon.NpcSpawnId,
        npcSpawnSpot.NpcSpawnCommon.NpcSpawnNum,
      );
      if (!result) {
        continue;
      }
      const { mapName, role } = result;

      let offsetX = 0;
      let offsetY = 0;
      if (role === "NormalMonster") {
        const angle =
          (spawnIndex / npcRandomSpawnSpot.NpcSpawn.length) * 2 * Math.PI;
        const radius = 750;
        offsetX = radius * Math.cos(angle);
        offsetY = radius * Math.sin(angle);
      }
      const category = nodes.find(
        (n) => n.type === role && n.mapName === mapName,
      )!;

      const spawn: (typeof nodes)[number]["spawns"][number] = {
        id,
        p: [
          npcRandomSpawnSpot.SpotCommon.Position.Y + offsetY,
          npcRandomSpawnSpot.SpotCommon.Position.X + offsetX,
        ] as [number, number],
      };
      if (
        category.spawns.some(
          (s) =>
            s.id === spawn.id && s.p[0] === spawn.p[0] && s.p[1] === spawn.p[1],
        )
      ) {
        continue;
      }
      category.spawns.push(spawn);
      spawnIndex++;
    }
  }

  for (const npcRandomSpawnSpotGroup of exportData.NpcRandomSpawnSpotGroup) {
    if (npcRandomSpawnSpotGroup.Name.startsWith("ContentTest")) {
      continue;
    }
    for (const npcSpawn of npcRandomSpawnSpotGroup.NpcSpawnList) {
      const [id, npc] = npcEntries.find(
        ([, npc]) => npc.ID === npcSpawn.NpcId,
      )!;

      const result = await processNPC(
        id,
        npc,
        npcRandomSpawnSpotGroup.Name,
        npcSpawn.NpcSpawnId,
        npcSpawn.NpcSpawnNum,
      );
      if (!result) {
        continue;
      }
      const { mapName, role } = result;
      const category = nodes.find(
        (n) => n.type === role && n.mapName === mapName,
      )!;

      for (const position of npcRandomSpawnSpotGroup.PositionList) {
        const spawn: (typeof nodes)[number]["spawns"][number] = {
          id,
          p: [position.Y, position.X] as [number, number],
        };
        if (
          category.spawns.some(
            (s) =>
              s.id === spawn.id &&
              s.p[0] === spawn.p[0] &&
              s.p[1] === spawn.p[1],
          )
        ) {
          continue;
        }
        category.spawns.push(spawn);
      }
    }
  }
}

for (const [key, data] of Object.entries(subZoneData)) {
  if (!key.endsWith("SzBoss")) {
    continue;
  }
  const id = key;
  const mapName = data.Zone.StringId;
  if (!zonePersistentData[mapName] || zonePersistentData[mapName].Disable) {
    continue;
  }
  enDict[id] = stringData[data.Title.StringId].English.LocalizedString;

  for (const area of data.Areas) {
    const zone = Object.values(zoneResources)
      .find((z) => z.Areas.find((a) => a.Key === area))!
      .Areas.find((a) => a.Key === area)!;
    if (!nodes.some((n) => n.type === "BossMonster" && n.mapName === mapName)) {
      nodes.push({
        type: "BossMonster",
        mapName,
        spawns: [],
      });
    }
    const category = nodes.find(
      (n) => n.type === "BossMonster" && n.mapName === mapName,
    )!;

    const spawn: (typeof nodes)[number]["spawns"][number] = {
      id,
      p: [zone.Position.Y, zone.Position.X] as [number, number],
    };
    if (
      category.spawns.some(
        (s) =>
          s.id === spawn.id && s.p[0] === spawn.p[0] && s.p[1] === spawn.p[1],
      )
    ) {
      continue;
    }
    category.spawns.push(spawn);
  }
}

filters.push(monsters);
filters.push(npcs);

const tiles: Record<
  string,
  {
    url?: string;
    options?: {
      minNativeZoom: number;
      maxNativeZoom: number;
      bounds: [[number, number], [number, number]];
      tileSize: number;
    };
    minZoom?: number;
    maxZoom?: number;
    fitBounds?: [[number, number], [number, number]];
    transformation?: [number, number, number, number];
  }
> = {};
const TILE_SIZE = 512;
const DEFAULT_PIXEL_PER_CENTIMETER = 0.040635;
const DUNGEON_PIXEL_PER_CENTIMETER = 0.005;

const sortedZoneData = Object.entries(zonePersistentData).sort((a, b) => {
  const aMiniature = a[1].MinimapData?.ObjectPath?.includes("miniature");
  const bMiniature = b[1].MinimapData?.ObjectPath?.includes("miniature");
  if (aMiniature && bMiniature) {
    return 0;
  }
  if (aMiniature) {
    return -1;
  }
  if (bMiniature) {
    return 1;
  }
  return 0;
});
for (const [mapName, zoneData] of sortedZoneData) {
  if (zoneData.Disable || !zoneData.MinimapData?.ObjectPath) {
    console.log("Skipping", mapName);
    continue;
  }
  const minimapDataAssetPath = `${CONTENT_DIR}/${zoneData.MinimapData.ObjectPath.replace(".0", ".json")}`;
  const minimapDataAsset = readJSON<MinimapDataAsset>(minimapDataAssetPath);
  const minimapData = minimapDataAsset[0];
  const path =
    TEXTURE_DIR +
    minimapData.Properties.MinimapTexture.AssetPathName.toLowerCase()
      .replace("/game", "/mad/content")
      .split(".")[0] +
    ".png";

  const pixelPerCentimeter = zoneData.MinimapData.ObjectPath.includes(
    "miniature",
  )
    ? DEFAULT_PIXEL_PER_CENTIMETER
    : DUNGEON_PIXEL_PER_CENTIMETER;
  const scale = pixelPerCentimeter / minimapData.Properties.PixelPerCentimeter;
  const offsetX =
    (minimapData.Properties.RelativePositionFromOrigin?.X || 0) / scale;
  const offsetY =
    (minimapData.Properties.RelativePositionFromOrigin?.Y || 0) / scale;
  const MAP_BOUNDS = [
    [-101000 + offsetY, -101400 + offsetX].map((v) => v * scale),
    [101800 + offsetY, 101400 + offsetX].map((v) => v * scale),
  ] as [[number, number], [number, number]];
  const REAL_SIZE = MAP_BOUNDS[1][0] - MAP_BOUNDS[0][0];
  const MULTIPLE = REAL_SIZE / TILE_SIZE;
  const OFFSET = [-MAP_BOUNDS[0][0] / MULTIPLE, -MAP_BOUNDS[0][1] / MULTIPLE];
  const outDir = `${OUT_DIR}/map-tiles/${mapName}`;
  if (Bun.env.TILES === "true") {
    await $`vips dzsave ${path} ${outDir} --tile-size 512 --background 0 --overlap 0 --layout google --suffix .jpg[Q=100]`;
    for (const file of readDirRecursive(outDir)) {
      if (file.includes("blank")) {
        await $`rm ${file}`;
        continue;
      }
      if (file.endsWith(".jpg") || file.endsWith(".png")) {
        await $`cwebp ${file} -m 6 -o ${file.replace(".jpg", ".webp").replace(".png", ".webp")} -quiet`;
        await $`rm ${file}`;
      }
    }
  }
  let maxNativeZoom = 3;
  try {
    maxNativeZoom = Math.max(...(await readDirSync(outDir).map((f) => +f)));
  } catch (e) {}

  const zoneResources = Object.entries(zoneResourceData).filter(
    (z) => z[1].Persistent.StringId === mapName,
  );
  for (const [zoneMapName, zoneResource] of zoneResources) {
    const newZoneMapName = zoneMapName.replace("_Special", "");
    if (newZoneMapName.includes("Test")) {
      continue;
    }
    if (zoneResource.AreaLevel.AssetPathName.includes("/Dungeon/")) {
      if (
        !(zoneMapName in dungeonStageData) &&
        !(zoneMapName in worldFieldData)
      ) {
        continue;
      }
    }

    tiles[newZoneMapName] = {
      url: `/map-tiles/${mapName}/{z}/{y}/{x}.webp`,
      options: {
        minNativeZoom: 0,
        maxNativeZoom: maxNativeZoom,
        bounds: MAP_BOUNDS,
        tileSize: TILE_SIZE,
      },
      minZoom: 0,
      maxZoom: 5,
      fitBounds: MAP_BOUNDS,
      transformation: [1 / MULTIPLE, OFFSET[1], 1 / MULTIPLE, OFFSET[0]],
    };

    const subZone = Object.values(subZoneData).find(
      (z) => z.Zone.StringId === zoneResource.Persistent.StringId,
    )!;

    const subZoneString = subZone
      ? stringData[subZone.Title.StringId].English.LocalizedString
      : null;
    const mapString =
      stringData[zoneResource.Title.StringId].English.LocalizedString;
    if (
      subZoneString &&
      subZoneString !== mapString &&
      !mapString.includes("Floor")
    ) {
      enDict[newZoneMapName] = `${subZoneString} ${mapString}`;
    } else {
      enDict[newZoneMapName] = mapString;
    }
  }
}

const zones: {
  id: string;
  zoneId: number;
}[] = [];
for (const [key, subZone] of Object.entries(subZoneData)) {
  const zoneId = subZone.ID;
  enDict[key] = stringData[subZone.Title.StringId].English.LocalizedString;
  zones.push({
    id: key,
    zoneId,
  });
}

// const items: {
//   id: string;
//   itemId: number;
//   icon: string;
// }[] = [];

// for (const [key, item] of Object.entries(materialItemData)) {
//   await processItem(key, item);
// }

// for (const [key, item] of Object.entries(equipmentItemData)) {
//   await processItem(key, item);
// }

// for (const [key, item] of Object.entries(boxItemData)) {
//   await processItem(key, item);
// }

// async function processItem(
//   key: string,
//   item:
//     | MMaterialItemData["0"]["Rows"]["0"]
//     | MEquipmentItemData["0"]["Rows"]["0"]
//     | MBoxItemData["0"]["Rows"]["0"],
// ) {
//   console.log("Processing item", key);
//   if (item.Title.StringId.includes("Test")) {
//     return;
//   }
//   if (!stringData[item.Title.StringId]) {
//     console.warn("Missing title data for", key);
//     return;
//   }
//   if (key.includes("Test")) {
//     return;
//   }
//   enDict[key] = stringData[item.Title.StringId].English.LocalizedString;
//   if (!stringData[item.Description.StringId]) {
//     // console.warn("Missing description data for", key);
//   } else {
//     enDict[`${key}_desc`] =
//       stringData[item.Description.StringId].English.LocalizedString;
//   }
//   let color;
//   if (item.CommonTrait.Grade === "EGrade::Grade0") {
//     color = "#f3e6aa";
//   } else if (item.CommonTrait.Grade === "EGrade::Grade1") {
//     color = "#d2cdbe";
//   } else if (item.CommonTrait.Grade === "EGrade::Grade2") {
//     color = "rgb(88, 156, 137)";
//   } else if (item.CommonTrait.Grade === "EGrade::Grade3") {
//     color = "#71c7e7";
//   } else if (item.CommonTrait.Grade === "EGrade::Grade4") {
//     color = "#9d71b9";
//   } else if (item.CommonTrait.Grade === "EGrade::Grade5") {
//     color = "#f2bb8f";
//   } else {
//     console.error(`Missing color for ${key}`);
//     return;
//   }

//   try {
//     const canvas = await addCircleToImage(
//       `${TEXTURE_DIR}${
//         item.Icon.AssetPathName!.toLowerCase()
//           .replace("/game", "/mad/content")
//           .split(".")[0]
//       }.png`,
//       color,
//     );
//     await saveImage(TEMP_DIR + `/${key}.png`, canvas.toBuffer("image/png"));
//     const path = await saveIcon(`${TEMP_DIR}/${key}.png`);

//     icons[key] = path;
//     items.push({
//       id: key,
//       itemId: item.ID,
//       icon: path,
//     });
//   } catch (e) {
//     console.error(`Error processing item ${key}`);
//   }
// }

const flatFilters = Object.values(filters).flatMap((f) => f.values);
nodes.sort((a, b) => {
  if (a.type === "BossMonster" && b.type !== "BossMonster") {
    return 1;
  }
  if (a.type !== "BossMonster" && b.type === "BossMonster") {
    return -1;
  }
  const aSize = flatFilters.find((f) => f.id === a.type)!.size!;
  const bSize = flatFilters.find((f) => f.id === b.type)!.size!;
  return aSize - bSize;
});

const priorityTileNames = [
  "Kildebat of Chaos",
  "Kildebat",
  "Avilius",
  "Bastium",
  "Celano",
  "Tronetel",
];
const sortedTiles = Object.entries(tiles)
  .sort((a, b) => {
    const aName = enDict[a[0]];
    const bName = enDict[b[0]];

    const priorityA = priorityTileNames.indexOf(aName);
    const priorityB = priorityTileNames.indexOf(bName);
    if (priorityA !== -1 && priorityB !== -1) {
      return priorityA - priorityB;
    }
    if (priorityA !== -1) {
      return -1;
    }
    if (priorityB !== -1) {
      return 1;
    }
    return aName.localeCompare(bName);
  })
  .reduce((acc, [k, v]) => {
    acc[k] = v;
    return acc;
  }, {});

const filteredNodes = nodes.filter((n) => {
  return !!tiles[n.mapName];
});
const filteredFilters = filters.map((f) => {
  f.values = f.values.filter((v) => {
    return !!filteredNodes.find((n) => n.type === v.id);
  });
  return f;
});

writeJSON(OUT_DIR + "/coordinates/tiles.json", sortedTiles);
writeJSON(OUT_DIR + "/coordinates/nodes.json", filteredNodes);
writeJSON(OUT_DIR + "/coordinates/filters.json", filteredFilters);
writeJSON(OUT_DIR + "/coordinates/zones.json", zones);
// writeJSON(OUT_DIR + "/coordinates/items.json", items);
writeJSON(OUT_DIR + "/dicts/en.json", enDict);

async function saveIcon(assetPath: string) {
  const fileName = assetPath.split("/").at(-1)?.split(".")[0]!;
  if (!savedIcons.includes(fileName)) {
    // console.log("Saving icon", fileName, assetPath);
    await $`cwebp ${assetPath} -m 6 -o ${OUT_DIR}/icons/${fileName}.webp -quiet`;
    savedIcons.push(fileName);
  }
  return `${fileName}.webp`;
}

function formatTimer(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secondsLeft = seconds % 60;
  let result = "";
  if (hours > 0) {
    result += `${hours}h `;
  }
  if (minutes > 0) {
    result += `${minutes}m `;
  }
  if (secondsLeft > 0) {
    result += `${secondsLeft}s`;
  }
  return result.trim();
}
