import { initDict, writeDict } from "./lib/dicts.js";
import { CONTENT_DIR, initDirs, OUTPUT_DIR, TEXTURE_DIR } from "./lib/dirs.js";
import {
  initFilters,
  initGlobalFilters,
  writeFilters,
  writeGlobalFilters,
} from "./lib/filters.js";
import {
  encodeToFile,
  readDirRecursive,
  readDirSync,
  readJSON,
} from "./lib/fs.js";
import { IconProps, saveIcon } from "./lib/image.js";
import { initNodes, writeNodes } from "./lib/nodes.js";
import { initRegions, writeRegions } from "./lib/regions.js";
import { generateTiles, initTiles, writeTiles } from "./lib/tiles.js";
import { initTypesIDs, writeTypesIDs } from "./lib/types-ids.js";
import {
  TeleportTravelConfigAsset,
  DA_WorldMapGlobalConfig,
  DT_LevelConfigs,
  MapData,
  Bug,
  DA_ItemType,
  DT_SpawnRarityConfigs,
  Forage,
  MiningNode,
  DT_LootBundleConfigs,
  DT_LootPoolConfigs,
  Tree,
  GrowableTree,
  Creature,
  DT_FishConfigs,
} from "./palia.types.js";
import { Node } from "./types.js";

initDirs(
  String.raw`C:\dev\Palia\Extracted\Data`,
  String.raw`C:\dev\Palia\Extracted\Texture`,
  String.raw`C:\dev\the-hidden-gaming-lair\static\palia`,
);

const enDict = initDict({
  VillageWorld: "Kilima Village",
  AdventureZoneWorld: "Bahari Bay",
  MajiMarket: "Fairgrounds",
  HousingPlot: "Housing Plot",
  AirTemple: "Air Temple",
  FireTemple: "Fire Temple",
  EarthTemple: "Earth Temple",
  WaterTemple: "Water Temple",
  locations: "Locations",
});

const worldMapGlobalConfig = await readJSON<DA_WorldMapGlobalConfig>(
  CONTENT_DIR + "/Palia/Content/Configs/DA_WorldMapGlobalConfig.json",
);
const levelConfigs = await readJSON<DT_LevelConfigs>(
  CONTENT_DIR + "/Palia/Content/Configs/DT_LevelConfigs.json",
);

const tiles = initTiles();
const filters = initFilters();
const nodes = initNodes();
const regions = initRegions();
const typesIDs = initTypesIDs();
const globalFilters = initGlobalFilters();

const worldMaps = worldMapGlobalConfig[0].Properties.WorldMaps;
const mapKeys: Record<string, string> = {};
for (const worldMap of worldMaps) {
  if (
    ![
      "Village_Root",
      "AZ1_01_Root",
      "Fairgrounds_MajiMarket",
      "HousingPlot",
      // 'AZ2_01_Root', // Ghost Village
    ].includes(worldMap.Key)
  ) {
    continue;
  }

  const image = worldMap.Value.Image;
  const name =
    worldMap.Key === "HousingPlot"
      ? "Map_HousingPlot"
      : image.AssetPathName.split("/").at(-1)!.split(".")[0];
  const path = `${TEXTURE_DIR}/Palia/Content/UI/WorldMap/Assets/${name}.png`;
  const bounds = [
    [worldMap.Value.TopLeftCorner.X, worldMap.Value.TopLeftCorner.Y],
    [worldMap.Value.BottomRightCorner.X, worldMap.Value.BottomRightCorner.Y],
  ];
  const width =
    Math.max(...bounds.map((b) => b[0])) - Math.min(...bounds.map((b) => b[0]));

  const offset = [
    (bounds[0][0] + bounds[1][0]) / 2,
    (bounds[0][1] + bounds[1][1]) / 2,
  ];
  tiles[worldMap.Value.Name] = (
    await generateTiles(
      worldMap.Value.Name,
      path,
      width,
      512,
      offset,
      undefined,
    )
  )[worldMap.Value.Name];
  mapKeys[worldMap.Key] = worldMap.Value.Name;
}

const privateSpaceMaps = worldMapGlobalConfig[0].Properties.PrivateSpaceMaps;
for (const privateSpaceMap of privateSpaceMaps) {
  const image = privateSpaceMap.Value.Image;
  const name = image.AssetPathName.split("/").at(-1)!.split(".")[0];
  const path = `${TEXTURE_DIR}/Palia/Content/UI/WorldMap/Assets/${name}.png`;

  const width = 15000;
  tiles[privateSpaceMap.Value.Name] = (
    await generateTiles(privateSpaceMap.Value.Name, path, width, 512)
  )[privateSpaceMap.Value.Name];
}
writeTiles(tiles);

for (const [levelKey, levelConfig] of Object.entries(levelConfigs[0].Rows)) {
  const mapName = Object.entries(mapKeys).find(([mapKey]) =>
    levelConfig.Level.AssetPathName.includes(mapKey),
  )?.[1];
  if (!mapName) {
    continue;
  }

  const mapPath =
    CONTENT_DIR +
    levelConfig.Level.AssetPathName.replace("/Game/", "/Palia/Content/").split(
      ".",
    )[0];

  const generatedMapPath = mapPath + "/_Generated_";
  const generatedFiles = readDirSync(generatedMapPath).map(
    (f) => generatedMapPath + "/" + f,
  );
  const mapFiles = [mapPath + ".json", ...generatedFiles];

  for (const mapFile of mapFiles) {
    const mapData = await readJSON<MapData>(mapFile);
    for (const element of mapData) {
      if (
        !element.Properties ||
        !element.Outer ||
        !("RelativeLocation" in element.Properties) ||
        !element.Properties.RelativeLocation
      ) {
        continue;
      }
      const id = element.Outer;
      let group;
      let type;
      let iconName;
      let size = 1;
      if (
        element.Name === "DefaultSceneRoot" &&
        element.Outer.startsWith("BP_Stables_Sign_UAID")
      ) {
        group = "locations";
        type = "stable";
        size = 1.5;

        enDict[type] = "Stable";
        iconName = await saveIcon(
          `${TEXTURE_DIR}/Palia/Content/UI/Assets_Shared/Icons/Icon_Compass_Stable_01.png`,
          type,
        );
        const destinationAddress = mapData.find(
          (e) => e.Outer === element.Outer && e.Properties?.DestinationAddress,
        );
        if (!destinationAddress) {
          console.warn("No destination address for stable", element.Outer);
          continue;
        }
        const destinationElement = await readJSON<TeleportTravelConfigAsset>(
          CONTENT_DIR +
            "/Palia/Content/" +
            destinationAddress
              .Properties!.DestinationAddress.ObjectPath.replace("Game/", "")
              .replace(/\.\d+/, "") +
            ".json",
        );
        if (!destinationElement) {
          console.warn("No destination element for stable", element.Outer);
          continue;
        }
        enDict[id] =
          destinationElement[0].Properties.DestinationDisplayName.LocalizedString;
      } else if (
        element.Name === "DefaultSceneRoot" &&
        element.Outer.startsWith("BP_Decor_Invisible_Wardrobe")
      ) {
        group = "locations";
        type = "wardrobe";
        size = 1.5;

        enDict[type] = "Wardrobe";
        iconName = await saveIcon(
          `${TEXTURE_DIR}/Palia/Content/UI/WorldMap/Assets/WT_Icon_Wardrobe.png`,
          type,
        );
      } else if (
        element.Name === "DefaultSceneRoot" &&
        element.Outer.startsWith("MapMarker_")
      ) {
        const textOnly = mapData.find(
          (e) =>
            e.Outer === element.Outer &&
            e.Properties?.Asset?.ObjectName.endsWith("TextOnly'"),
        );
        if (textOnly) {
          regions.push({
            id,
            mapName,
            border: [],
            center: [
              element.Properties.RelativeLocation.Y,
              element.Properties.RelativeLocation.X,
            ],
          });
          enDict[id] = enDict[id] =
            textOnly.Properties!.DisplayText.SourceString;
          continue;
        }

        const trackingTarget = mapData.find(
          (e) =>
            e.Outer === element.Outer &&
            (e.Properties?.Tooltip || e.Properties?.DisplayText),
        );
        if (!trackingTarget) {
          console.warn("No tracking target for landmark", element.Outer);
          continue;
        }
        group = "locations";
        type = "landmark";
        size = 1.5;

        enDict[type] = "Landmark";
        iconName = await saveIcon(
          `${TEXTURE_DIR}/Palia/Content/UI/WorldMap/Assets/Icon_Landmark_01.png`,
          type,
        );
        enDict[id] =
          trackingTarget.Properties!.Tooltip?.SourceString ||
          trackingTarget.Properties!.DisplayText.SourceString;
      } else if (element.Name === "Teleporter Root") {
        group = "locations";
        size = 1.5;

        const tooltipElement = mapData.find(
          (e) =>
            e.Outer === element.Outer && e.Properties?.Tooltip?.LocalizedString,
        );
        if (
          tooltipElement &&
          tooltipElement.Properties!.Tooltip.LocalizedString ===
            "To Housing Plot"
        ) {
          type = "housingPlot";
          enDict[type] = "Housing Plot";
          enDict[id] = tooltipElement.Properties!.Tooltip.LocalizedString;
          iconName = await saveIcon(
            `${TEXTURE_DIR}/Palia/Content/UI/Assets_Shared/Icons/Icon_Compass_Home_01.png`,
            type,
          );
        } else if (tooltipElement) {
          if (
            tooltipElement.Properties!.WorldLocationContext ===
              "EWorldLocationContext::LimitedEvent" &&
            mapName === "VillageWorld"
          ) {
            console.warn("Limited event teleporter", element.Outer);
            continue;
          }
          type = "zone";
          enDict[type] = "Zone";
          enDict[id] = tooltipElement.Properties!.Tooltip.LocalizedString;
          iconName = await saveIcon(
            `${TEXTURE_DIR}/Palia/Content/UI/Assets_Shared/Icons/WT_Icon_Compass_Zone.png`,
            type,
          );
        } else {
          const targetTravelAssetElement = mapData.find(
            (e) => e.Outer === element.Outer && e.Properties?.TargetTravelAsset,
          );
          if (targetTravelAssetElement) {
            type = "location";
            enDict[type] = "Location";
            iconName = await saveIcon(
              `${TEXTURE_DIR}/Palia/Content/UI/WorldMap/Assets/Icon_Map_Marker.png`,
              type,
            );
            const destinationElement =
              await readJSON<TeleportTravelConfigAsset>(
                CONTENT_DIR +
                  "/Palia/Content/" +
                  targetTravelAssetElement
                    .Properties!.TargetTravelAsset.ObjectPath.replace(
                      "Game/",
                      "",
                    )
                    .replace(/\.\d+/, "") +
                  ".json",
              );
            if (!destinationElement) {
              console.warn("No destination element for stable", element.Outer);
              continue;
            }
            enDict[id] =
              destinationElement[0].Properties.DestinationDisplayName.LocalizedString;
            if (destinationElement[0].Properties.WrongTagsErrorMessage) {
              enDict[`${id}_desc`] =
                destinationElement[0].Properties.WrongTagsErrorMessage.LocalizedString;
            }
          } else {
            continue;
          }
        }
      } else {
        continue;
      }

      let category = filters.find((f) => f.group === group);
      if (!category) {
        filters.push({
          group: group,
          defaultOpen: true,
          defaultOn: true,
          values: [],
        });
        category = filters.find((f) => f.group === group)!;
      }
      if (!category.values.some((v) => v.id === type)) {
        category.values.push({
          id: type,
          icon: iconName,
          size,
        });
      }
      let oldNodes = nodes.find(
        (n) => n.type === type && n.mapName === mapName,
      );
      if (!oldNodes) {
        nodes.push({ type: type, mapName, spawns: [], static: true });
        oldNodes = nodes.find((n) => n.type === type && n.mapName === mapName)!;
      }

      const spawn: Node["spawns"][number] = {
        id,
        p: [
          element.Properties.RelativeLocation.Y,
          element.Properties.RelativeLocation.X,
        ],
      };
      if (
        oldNodes.spawns.some(
          (s) => s.p[0] === spawn.p[0] && s.p[1] === spawn.p[1],
        )
      ) {
        console.warn("Duplicate spawn", spawn.id);
        continue;
      }
      oldNodes.spawns.push(spawn);
    }
  }
}

const spawnRarityConfigs = await readJSON<DT_SpawnRarityConfigs>(
  CONTENT_DIR + "/Palia/Content/Configs/DT_SpawnRarityConfigs.json",
);

// Bugs
{
  const skillFiles = readDirRecursive(
    CONTENT_DIR + "/Palia/Content/Gameplay/Skills/BugCatching/Bugs",
  );
  for (const skillFile of skillFiles) {
    const skill = await readJSON<Bug>(skillFile);

    const lootComponent = skill.find((s) => s.Type === "LootComponent");
    if (!lootComponent) {
      console.warn("No loot component", skillFile);
      continue;
    }
    let itemType;
    if (!lootComponent.Properties!.RewardFinal?.ItemType) {
      const templateBug = await readJSON<Bug>(
        CONTENT_DIR +
          "/Palia/Content/" +
          lootComponent
            .Template!.ObjectPath.replace("Game/", "")
            .replace(/\.\d+/, "") +
          ".json",
      );
      const templateLootComponent = templateBug.find(
        (s) => s.Type === "LootComponent",
      )!;
      itemType = await readJSON<DA_ItemType>(
        CONTENT_DIR +
          "/Palia/Content/" +
          templateLootComponent
            .Properties!.RewardFinal?.ItemType.ObjectPath.replace("Game/", "")
            .replace(/\.\d+/, "") +
          ".json",
      );
    } else {
      itemType = await readJSON<DA_ItemType>(
        CONTENT_DIR +
          "/Palia/Content/" +
          lootComponent
            .Properties!.RewardFinal?.ItemType.ObjectPath.replace("Game/", "")
            .replace(/\.\d+/, "") +
          ".json",
      );
    }
    if (!itemType[0].Properties?.ItemIcon?.AssetPathName) {
      throw new Error("No reward final item" + skillFile);
    }
    if (!itemType[0].Properties.DisplayName.LocalizedString) {
      continue;
    }
    if (skillFile.includes("QuestSpecial")) {
      continue;
    }

    const baseType = skillFile.replace(".json", "").split("\\").at(-1)!;
    const type = baseType.replace("+", "_star").toLowerCase();
    const typeId = baseType + "_C";
    const isStarQuality = typeId.includes("+");

    const rarity = itemType[0].Properties.Rarity.replace("EItemRarity::", "");
    let group = "bugs_" + rarity.toLowerCase();
    if (isStarQuality) {
      group += "_star";
    }

    const size = 1;
    let category = filters.find((f) => f.group === group);
    if (!category) {
      filters.push({
        group: group,
        defaultOpen: false,
        defaultOn: true,
        values: [],
      });
      category = filters.find((f) => f.group === group)!;
      enDict[group] = "Bugs";
      enDict[group] += ` (${rarity})`;
      if (isStarQuality) {
        enDict[group] += " - Star Quality";
      }
    }

    if (!category.values.some((v) => v.id === type)) {
      const iconProps: IconProps = {};
      if (isStarQuality) {
        iconProps.badgeIcon =
          TEXTURE_DIR +
          "/Palia/Content/UI/Assets_Shared/Icons/Icon_Star_01.png";
      }
      const iconName = await saveIcon(
        "/Palia/Content" +
          itemType[0].Properties.ItemIcon.AssetPathName.replace(
            "Game/",
            "",
          ).split(".")[0] +
          ".png",
        type,
        iconProps,
      );

      category.values.push({
        id: type,
        icon: iconName,
        size,
        live_only: isStarQuality,
      });
      enDict[type] = itemType[0].Properties.DisplayName.LocalizedString;
      if (isStarQuality) {
        enDict[type] += " - Star Quality";
      }
      enDict[`${type}_desc`] =
        `<p>Max Stack Size: ${itemType[0].Properties.MaxStackSize}</p>`;

      const baseTypeId = typeId.replace("+", "");
      const spawnRarityConfig = Object.entries(spawnRarityConfigs[0].Rows).find(
        (config) => config[0].toLowerCase() === baseTypeId.toLowerCase(),
      );
      if (spawnRarityConfig?.[1].StarQualityVariant?.AssetPathName) {
        enDict[`${type}_desc`] +=
          `<p>Star Quality Chance: ${spawnRarityConfig[1].StarQualityChance * 100}%</p>`;
      }
      if (isStarQuality) {
        enDict[`${type}_desc`] +=
          itemType[0].Properties.StarQualityDescription[0].LocalizedString;
      } else {
        enDict[`${type}_desc`] +=
          itemType[0].Properties.Description.LocalizedString;
      }
      typesIDs[typeId] = type;
    }
  }
}

// Foraging
{
  const skillFiles = readDirRecursive(
    CONTENT_DIR + "/Palia/Content/Gameplay/Skills/Foraging",
  );
  for (const skillFile of skillFiles) {
    const skill = await readJSON<Forage>(skillFile);

    const gatherableComponent = skill.find(
      (s) => s.Type === "GatherableComponent",
    );
    if (!gatherableComponent) {
      console.warn("No gatherable component", skillFile);
      continue;
    }
    const itemType = await readJSON<DA_ItemType>(
      CONTENT_DIR +
        "/Palia/Content/" +
        gatherableComponent
          .Properties!.ItemType!.ObjectPath.replace("Game/", "")
          .replace(/\.\d+/, "") +
        ".json",
    );
    if (!itemType[0].Properties?.ItemIcon?.AssetPathName) {
      throw new Error("No reward final item" + skillFile);
    }
    if (!itemType[0].Properties.DisplayName.LocalizedString) {
      continue;
    }
    if (
      itemType[0].Properties.ItemIcon.AssetPathName.includes("Elderwood") ||
      itemType[0].Properties.Description.LocalizedString.includes("Elderwood")
    ) {
      continue;
    }

    const baseType = skillFile.replace(".json", "").split("\\").at(-1)!;
    const type = baseType.replace("+", "_star").toLowerCase();
    const typeId = baseType + "_C";
    const isStarQuality = typeId.includes("+");

    const rarity =
      itemType[0].Properties.Rarity?.replace("EItemRarity::", "") ?? "Special";
    let group = "foraging_" + rarity.toLowerCase();
    if (isStarQuality) {
      group += "_star";
    }

    const size = 1;
    let category = filters.find((f) => f.group === group);
    if (!category) {
      filters.push({
        group: group,
        defaultOpen: false,
        defaultOn: true,
        values: [],
      });
      category = filters.find((f) => f.group === group)!;
      enDict[group] = "Foraging";
      enDict[group] += ` (${rarity})`;
      if (isStarQuality) {
        enDict[group] += " - Star Quality";
      }
    }

    if (!category.values.some((v) => v.id === type)) {
      const iconProps: IconProps = {};
      if (isStarQuality) {
        iconProps.badgeIcon =
          TEXTURE_DIR +
          "/Palia/Content/UI/Assets_Shared/Icons/Icon_Star_01.png";
      }
      const iconName = await saveIcon(
        "/Palia/Content" +
          itemType[0].Properties.ItemIcon.AssetPathName.replace(
            "Game/",
            "",
          ).split(".")[0] +
          ".png",
        type,
        iconProps,
      );

      category.values.push({
        id: type,
        icon: iconName,
        size,
        live_only: isStarQuality,
      });
      enDict[type] = itemType[0].Properties.DisplayName.LocalizedString;
      if (isStarQuality) {
        enDict[type] += " - Star Quality";
      }
      enDict[`${type}_desc`] =
        `<p>Max Stack Size: ${itemType[0].Properties.MaxStackSize}</p>`;

      const baseTypeId = typeId.replace("+", "");
      const spawnRarityConfig = Object.entries(spawnRarityConfigs[0].Rows).find(
        (config) => config[0].toLowerCase() === baseTypeId.toLowerCase(),
      );
      if (spawnRarityConfig?.[1].StarQualityVariant?.AssetPathName) {
        enDict[`${type}_desc`] +=
          `<p>Star Quality Chance: ${spawnRarityConfig[1].StarQualityChance * 100}%</p>`;
      }

      enDict[`${type}_desc`] +=
        itemType[0].Properties.Description.LocalizedString;
      typesIDs[typeId] = type;
    }
  }
}

const lootBundleConfigs = await readJSON<DT_LootBundleConfigs>(
  CONTENT_DIR + "/Palia/Content/Configs/DT_LootBundleConfigs.json",
);
const lootPoolConfigs = await readJSON<DT_LootPoolConfigs>(
  CONTENT_DIR + "/Palia/Content/Configs/DT_LootPoolConfigs.json",
);

// Mining
{
  const skillFiles = readDirRecursive(
    CONTENT_DIR + "/Palia/Content/Gameplay/Skills/Mining/Nodes",
  );
  for (const skillFile of skillFiles) {
    const skill = await readJSON<MiningNode>(skillFile);

    const gatherableLootComponent = skill.find(
      (s) => s.Type === "GatherableLootComponent",
    );
    if (!gatherableLootComponent) {
      console.warn("No gatherable loot component", skillFile);
      continue;
    }
    const lootBundleConfig =
      lootBundleConfigs[0].Rows[
        gatherableLootComponent.Properties!.RewardFinal!.Loot.RowName
      ];

    if (!lootBundleConfig.bEnabled) {
      continue;
    }

    const baseType = skillFile.replace(".json", "").split("\\").at(-1)!;
    const typeId = baseType + "_C";
    const size = 1;

    if (typeId.includes("_AZ2")) {
      continue;
    }
    const type = gatherableLootComponent.Properties!.RewardFinal!.Loot.RowName;
    const group = "mining";
    let category = filters.find((f) => f.group === group);
    if (!category) {
      filters.push({
        group: group,
        defaultOpen: false,
        defaultOn: true,
        values: [],
      });
      category = filters.find((f) => f.group === group)!;
      enDict[group] = "Mining";
    }

    const descs: string[] = [];
    for (const loot of lootBundleConfig.LootBundle) {
      const lootPoolConfig = Object.entries(lootPoolConfigs[0].Rows).find(
        (e) => e[0].toLowerCase() === loot.RowName.toLowerCase(),
      );
      if (!lootPoolConfig) {
        console.warn("No loot pool config", loot.RowName);
        continue;
      }
      for (const loot of lootPoolConfig![1].LootPool) {
        if (!loot.ItemType) {
          continue;
        }

        const itemType = await readJSON<DA_ItemType>(
          CONTENT_DIR +
            "/Palia/Content/" +
            loot
              .ItemType!.ObjectPath.replace("Game/", "")
              .replace(/\.\d+/, "") +
            ".json",
        );
        const rarity =
          itemType[0].Properties.Rarity?.replace("EItemRarity::", "") ??
          "Special";
        let desc = `${itemType[0].Properties.DisplayName.LocalizedString} (${rarity})`;

        // desc += `<p>Max Stack Size: ${itemType[0].Properties.MaxStackSize}</p>`;
        // desc += `<p>Rarity: ${rarity}</p>`;

        // desc += `<p>${itemType[0].Properties.Description.LocalizedString}</p>`;
        if (!descs.includes(desc)) {
          descs.push(desc);
        }
      }
      if (!category.values.some((v) => v.id === type)) {
        const iconProps: IconProps = {};
        const oreType = type.split(".").at(1)!;
        const icons = [
          "Icon_Ore_Clay",
          "Icon_Ore_Copper",
          "Icon_Ore_Iron",
          "Icon_Ore_Palium",
          "Icon_Stone",
        ];
        const iconPath = icons.find((i) => i.includes(oreType));
        if (!iconPath) {
          continue;
        }
        enDict[type] = oreType;
        if (typeId.includes("Large")) {
          enDict[type] += " (L)";
          iconProps.circle = true;
          iconProps.color = "red";
        } else if (typeId.includes("Medium")) {
          enDict[type] += " (M)";
          iconProps.circle = true;
          iconProps.color = "yellow";
        } else if (typeId.includes("Small")) {
          enDict[type] += " (S)";
          iconProps.circle = true;
          iconProps.color = "green";
        }

        const iconName = await saveIcon(
          `/Palia/Content/UI/Icons/${iconPath}.png`,
          type,
          iconProps,
        );

        category.values.push({
          id: type,
          icon: iconName,
          size,
        });
      }
    }
    const spawnRarityConfig = Object.entries(spawnRarityConfigs[0].Rows).find(
      (config) => config[0].toLowerCase() === typeId.toLowerCase(),
    );
    if (spawnRarityConfig) {
      enDict[`${type}_desc`] =
        `<p>Rarity: ${spawnRarityConfig![1].BaseRarity.replace("EItemRarity::", "")}</p>`;
      enDict[`${type}_desc`] += `<p><b>Drops:</b></p>${descs.join("<br>")}`;
    } else if (!enDict[`${type}_desc`]) {
      enDict[`${type}_desc`] = `<p><b>Drops:</b></p>${descs.join("<br>")}`;
    }
    typesIDs[typeId] = type;
  }
}
// Lumberjacking
{
  const skillFiles = readDirRecursive(
    CONTENT_DIR + "/Palia/Content/Gameplay/Skills/Lumberjacking/Tree",
  );
  for (const skillFile of skillFiles) {
    if (
      (!skillFile.includes("BP_TreeChoppable_") &&
        !skillFile.includes("BP_Bush_")) ||
      skillFile.includes("Legacy") ||
      skillFile.includes("_Elder_")
    ) {
      continue;
    }
    const skill = await readJSON<Tree>(skillFile);

    const gatherableLootComponent = skill.find(
      (s) => s.Type === "GatherableLootComponent",
    );
    if (!gatherableLootComponent?.Properties?.RewardFinal?.Loot) {
      console.warn("No gatherable loot component", skillFile);
      continue;
    }
    const lootBundleConfig =
      lootBundleConfigs[0].Rows[
        gatherableLootComponent.Properties!.RewardFinal!.Loot.RowName
      ];

    if (!lootBundleConfig) {
      console.warn("No loot bundle config", skillFile);
      continue;
    }
    if (!lootBundleConfig.bEnabled) {
      continue;
    }

    const baseType = skillFile.replace(".json", "").split("\\").at(-1)!;
    const typeId = baseType + "_C";
    const size = 1;

    let type = gatherableLootComponent.Properties!.RewardFinal!.Loot.RowName;
    if (type.includes(".Magical")) {
      const template = await readJSON<Tree>(
        CONTENT_DIR +
          "/Palia/Content/" +
          gatherableLootComponent
            .Template!.ObjectPath.replace("Game/", "")
            .replace(/\.\d+/, "") +
          ".json",
      );
      const templateGatherableLootComponent = template.find(
        (s) => s.Type === "GatherableLootComponent",
      );
      type =
        templateGatherableLootComponent!.Properties!.RewardFinal!.Loot.RowName +
        ".Magical";
    }
    const isMagical = type.endsWith(".Magical");

    const group = isMagical ? "lumberjacking_magical" : "lumberjacking";
    let category = filters.find((f) => f.group === group);
    if (!category) {
      filters.push({
        group: group,
        defaultOpen: false,
        defaultOn: true,
        values: [],
      });
      category = filters.find((f) => f.group === group)!;
      enDict[group] = isMagical ? "Flow Trees" : "Trees";
    }

    const descs: string[] = [];
    for (const loot of lootBundleConfig.LootBundle) {
      const lootPoolConfig = Object.entries(lootPoolConfigs[0].Rows).find(
        (e) => e[0].toLowerCase() === loot.RowName.toLowerCase(),
      );
      if (!lootPoolConfig) {
        console.warn("No loot pool config", loot.RowName);
        continue;
      }
      for (const loot of lootPoolConfig![1].LootPool) {
        if (!loot.ItemType) {
          continue;
        }

        const itemType = await readJSON<DA_ItemType>(
          CONTENT_DIR +
            "/Palia/Content/" +
            loot
              .ItemType!.ObjectPath.replace("Game/", "")
              .replace(/\.\d+/, "") +
            ".json",
        );
        const rarity =
          itemType[0].Properties.Rarity?.replace("EItemRarity::", "") ??
          "Special";
        let desc = `${itemType[0].Properties.DisplayName.LocalizedString} (${rarity})`;

        // desc += `<p>Max Stack Size: ${itemType[0].Properties.MaxStackSize}</p>`;
        // desc += `<p>Rarity: ${rarity}</p>`;

        // desc += `<p>${itemType[0].Properties.Description.LocalizedString}</p>`;
        if (!descs.includes(desc)) {
          descs.push(desc);
        }
      }
      if (!category.values.some((v) => v.id === type)) {
        const iconProps: IconProps = {};
        const growableTree = await readJSON<GrowableTree>(
          skillFile
            .replace(
              "\\Tree\\BP_TreeChoppable_",
              "\\Tree\\Growable\\BP_TreeGrowable_",
            )
            .replace(
              "\\Tree\\CoOp\\BP_TreeChoppable_",
              "\\Tree\\Growable\\BP_TreeGrowable_",
            )
            .replace("_CoOp", "")
            .replace("2", ""),
        );
        const gatherableComponent = growableTree.find(
          (s) => s.Type === "GatherableComponent",
        );
        if (!gatherableComponent) {
          console.warn("No gatherable component", skillFile);
          continue;
        }
        const itemType = await readJSON<DA_ItemType>(
          CONTENT_DIR +
            "/Palia/Content/" +
            gatherableComponent
              .Properties!.ItemType!.ObjectPath.replace("Game/", "")
              .replace(/\.\d+/, "") +
            ".json",
        );
        let iconPath =
          "/Palia/Content" +
          itemType[0].Properties.ItemIcon.AssetPathName.replace(
            "Game/",
            "",
          ).split(".")[0] +
          ".png";
        if (!iconPath) {
          continue;
        }

        enDict[type] = "";
        if (isMagical) {
          enDict[type] += "Flow ";
          iconPath = iconPath.replace(".png", "Flow.png");
        }
        enDict[type] += type.split(".")[1];
        if (typeId.includes("Large")) {
          enDict[type] += " (L)";
        } else if (typeId.includes("Medium")) {
          enDict[type] += " (M)";
        } else if (typeId.includes("Small")) {
          enDict[type] += " (S)";
        } else if (typeId.includes("Sapling")) {
          enDict[type] += " (XS)";
        }
        const iconName = await saveIcon(iconPath, type, iconProps);

        category.values.push({
          id: type,
          icon: iconName,
          size,
        });
      }
    }
    const spawnRarityConfig = Object.entries(spawnRarityConfigs[0].Rows).find(
      (config) => config[0].toLowerCase() === typeId.toLowerCase(),
    );
    if (spawnRarityConfig) {
      enDict[`${type}_desc`] =
        `<p>Rarity: ${spawnRarityConfig![1].BaseRarity.replace("EItemRarity::", "")}</p>`;
      enDict[`${type}_desc`] += `<p><b>Drops:</b></p>${descs.join("<br>")}`;
    } else if (!enDict[`${type}_desc`]) {
      enDict[`${type}_desc`] = `<p><b>Drops:</b></p>${descs.join("<br>")}`;
    }
    typesIDs[typeId] = type;
  }
}

// Hunting
{
  const skillFiles = readDirRecursive(
    CONTENT_DIR + "/Palia/Content/Gameplay/Skills/Hunting",
  );
  for (const skillFile of skillFiles) {
    if (
      !skillFile.includes("BP_ValeriaHuntingCreature_") ||
      skillFile.includes("_Base") ||
      skillFile.includes("_MirrorImage")
    ) {
      continue;
    }
    const skill = await readJSON<Creature>(skillFile);

    const lootComponent = skill.find((s) => s.Type === "LootComponent");
    if (!lootComponent?.Properties?.RewardFinal?.Loot) {
      console.warn("No loot component", skillFile);
      continue;
    }
    const lootBundleConfig =
      lootBundleConfigs[0].Rows[
        lootComponent.Properties!.RewardFinal!.Loot.RowName
      ];

    if (!lootBundleConfig) {
      console.warn("No loot bundle config", skillFile);
      continue;
    }
    if (!lootBundleConfig.bEnabled) {
      continue;
    }

    const baseType = skillFile.replace(".json", "").split("\\").at(-1)!;
    const typeId = baseType + "_C";
    const size = 1;

    const type = lootComponent.Properties!.RewardFinal!.Loot.RowName;

    const group = "hunting";
    let category = filters.find((f) => f.group === group);
    if (!category) {
      filters.push({
        group: group,
        defaultOpen: false,
        defaultOn: true,
        values: [],
      });
      category = filters.find((f) => f.group === group)!;
      enDict[group] = "Hunting";
    }

    const descs: string[] = [];
    let iconPath;
    for (const lootBundle of lootBundleConfig.LootBundle) {
      const lootPoolConfig = Object.entries(lootPoolConfigs[0].Rows).find(
        (e) => e[0].toLowerCase() === lootBundle.RowName.toLowerCase(),
      );
      if (!lootPoolConfig) {
        console.warn("No loot pool config", lootBundle.RowName);
        continue;
      }
      for (const lootPool of lootPoolConfig![1].LootPool) {
        if (!lootPool.ItemType) {
          continue;
        }

        const itemType = await readJSON<DA_ItemType>(
          CONTENT_DIR +
            "/Palia/Content/" +
            lootPool
              .ItemType!.ObjectPath.replace("Game/", "")
              .replace(/\.\d+/, "") +
            ".json",
        );
        const rarity =
          itemType[0].Properties.Rarity?.replace("EItemRarity::", "") ??
          "Special";
        let desc = `${itemType[0].Properties.DisplayName.LocalizedString} (${rarity})`;

        // desc += `<p>Max Stack Size: ${itemType[0].Properties.MaxStackSize}</p>`;
        // desc += `<p>Rarity: ${rarity}</p>`;

        // desc += `<p>${itemType[0].Properties.Description.LocalizedString}</p>`;
        if (!descs.includes(desc)) {
          descs.push(desc);
        }

        if (lootBundle.RowName.includes("Trophy")) {
          iconPath =
            "/Palia/Content" +
            itemType[0].Properties.ItemIcon.AssetPathName.replace(
              "Game/",
              "",
            ).split(".")[0] +
            ".png";
        }
      }
      if (!category.values.some((v) => v.id === type)) {
        const iconProps: IconProps = {};

        if (!iconPath) {
          continue;
        }
        const creatureNames: Record<string, string> = {
          BP_ValeriaHuntingCreature_Chapaa_T1_C: "Spotted Chapaa",
          BP_ValeriaHuntingCreature_Chapaa_T2_C: "Striped Chapaa",
          BP_ValeriaHuntingCreature_Chapaa_T3_C: "Azure Chapaa",
          BP_ValeriaHuntingCreature_Cearnuk_T1_C: "Sernuk",
          BP_ValeriaHuntingCreature_Cearnuk_T2_C: "Elder Sernuk",
          BP_ValeriaHuntingCreature_Cearnuk_T3_C: "Proudhorn Sernuk",
          BP_ValeriaHuntingCreature_TreeClimber_T1_C: "Muujin",
          BP_ValeriaHuntingCreature_TreeClimber_T2_C: "Banded Muujin",
          BP_ValeriaHuntingCreature_TreeClimber_T3_C: "Bluebristle Muujin",
        };

        enDict[type] = creatureNames[typeId];
        const iconName = await saveIcon(iconPath, type, iconProps);

        category.values.push({
          id: type,
          icon: iconName,
          size,
        });
      }
    }
    const spawnRarityConfig = Object.entries(spawnRarityConfigs[0].Rows).find(
      (config) => config[0].toLowerCase() === typeId.toLowerCase(),
    );
    if (spawnRarityConfig) {
      enDict[`${type}_desc`] =
        `<p>Rarity: ${spawnRarityConfig![1].BaseRarity.replace("EItemRarity::", "")}</p>`;
      enDict[`${type}_desc`] += `<p><b>Drops:</b></p>${descs.join("<br>")}`;
    } else if (!enDict[`${type}_desc`]) {
      enDict[`${type}_desc`] = `<p><b>Drops:</b></p>${descs.join("<br>")}`;
    }
    typesIDs[typeId] = type;
  }
}

// Fishing
{
  const fishConfigs = await readJSON<DT_FishConfigs>(
    CONTENT_DIR + "/Palia/Content/Configs/DT_FishConfigs.json",
  );
  for (const [type, config] of Object.entries(fishConfigs[0].Rows)) {
    if (!config.FishItemType) {
      continue;
    }
    if (type.endsWith("_SQ") || type.includes("Questitem_")) {
      continue;
    }
    const starQualityConfig = fishConfigs[0].Rows[type + "_SQ"];

    const typeId = config.FishBlueprint.AssetPathName.split(".").at(-1)!;
    const size = 1;
    const itemType = await readJSON<DA_ItemType>(
      CONTENT_DIR +
        "/Palia/Content/" +
        config.FishItemType.ObjectPath.replace("Game/", "").replace(
          /\.\d+/,
          "",
        ) +
        ".json",
    );

    const rarity =
      itemType[0].Properties.Rarity?.replace("EItemRarity::", "") ?? "Special";
    let group = "fishing_" + rarity.toLowerCase();

    let category = filters.find((f) => f.group === group);
    if (!category) {
      filters.push({
        group: group,
        defaultOpen: false,
        defaultOn: true,
        values: [],
      });
      category = filters.find((f) => f.group === group)!;
      enDict[group] = `Fishing (${rarity})`;
    }

    if (!category.values.some((v) => v.id === type)) {
      const iconProps: IconProps = {};
      const iconName = await saveIcon(
        "/Palia/Content" +
          itemType[0].Properties.ItemIcon.AssetPathName.replace(
            "Game/",
            "",
          ).split(".")[0] +
          ".png",
        type,
        iconProps,
      );

      category.values.push({
        id: type,
        icon: iconName,
        size,
      });
      enDict[type] = itemType[0].Properties.DisplayName.LocalizedString;

      enDict[`${type}_desc`] =
        `<p>Max Stack Size: ${itemType[0].Properties.MaxStackSize}</p><p>Difficulty: ${config.DifficultyLevel}</p>`;
      if (starQualityConfig) {
        enDict[`${type}_desc`] +=
          `<p>Star Quality Difficulty: ${starQualityConfig.DifficultyLevel}</p>`;
      }
      const baseTypeId = typeId.replace("+", "");
      const spawnRarityConfig = Object.entries(spawnRarityConfigs[0].Rows).find(
        (config) => config[0].toLowerCase() === baseTypeId.toLowerCase(),
      );
      if (spawnRarityConfig?.[1].StarQualityVariant?.AssetPathName) {
        enDict[`${type}_desc`] +=
          `<p>Star Quality Chance: ${spawnRarityConfig[1].StarQualityChance * 100}%</p>`;
      }
      enDict[`${type}_desc`] +=
        itemType[0].Properties.Description.LocalizedString;
      typesIDs[typeId] = type;
    }
  }
}

const sortPriority = [
  "locations",
  "mining",
  "hunting",
  "lumberjacking_magical",
  "lumberjacking",
  "bugs_epic_star",
  "bugs_epic",
  "bugs_rare_star",
  "bugs_rare",
  "bugs_uncommon_star",
  "bugs_uncommon",
  "bugs_common_star",
  "bugs_common",
  "foraging_special",
  "foraging_legendary",
  "foraging_epic_star",
  "foraging_epic",
  "foraging_rare_star",
  "foraging_rare",
  "foraging_uncommon_star",
  "foraging_uncommon",
  "foraging_common_star",
  "foraging_common",
  "foraging_abundant",
  "fishing_epic",
  "fishing_rare",
  "fishing_uncommon",
  "fishing_common",
  "fishing_special",
  "fishing_abundant",
];
const sortedFilters = filters.sort(
  (a, b) => sortPriority.indexOf(a.group) - sortPriority.indexOf(b.group),
);
writeFilters(sortedFilters);
writeDict(enDict, "en");
writeNodes(nodes);
Object.keys(tiles).forEach((mapName) => {
  encodeToFile(
    OUTPUT_DIR + `/coordinates/cbor/${mapName}.cbor`,
    nodes.filter((n) => !n.mapName || n.mapName === mapName),
  );
});

writeRegions(regions);
writeTypesIDs(typesIDs);
writeGlobalFilters(globalFilters);

console.log("Done");
