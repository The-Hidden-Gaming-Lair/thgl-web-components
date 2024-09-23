import { initDict, writeDict } from "./lib/dicts.js";
import { CONTENT_DIR, initDirs, OUTPUT_DIR, TEXTURE_DIR } from "./lib/dirs.js";
import {
  initFilters,
  initGlobalFilters,
  writeFilters,
  writeGlobalFilters,
} from "./lib/filters.js";
import { encodeToFile, readDirSync, readJSON } from "./lib/fs.js";
import { saveIcon } from "./lib/image.js";
import { initNodes, writeNodes } from "./lib/nodes.js";
import { initRegions, writeRegions } from "./lib/regions.js";
import { generateTiles, initTiles, writeTiles } from "./lib/tiles.js";
import { initTypesIDs, writeTypesIDs } from "./lib/types-ids.js";
import {
  TeleportTravelConfigAsset,
  DA_WorldMapGlobalConfig,
  DT_LevelConfigs,
  MapData,
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
              .replace(".0", "") +
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
                    .replace(".0", "") +
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

writeFilters(filters);
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
