import { write } from "bun";
import {
  CONTENT_DIR,
  initDirs,
  OUTPUT_DIR,
  TEMP_DIR,
  TEXTURE_DIR,
} from "./lib/dirs.js";
import { encodeToFile, readDirSync, readJSON } from "./lib/fs.js";
import {
  addToIconSprite,
  arrayJoinImages,
  IconProps,
  saveIconSprite,
} from "./lib/image.js";
import { generateTiles, initTiles, writeTiles } from "./lib/tiles.js";
import { initNodes, writeNodes } from "./lib/nodes.js";
import {
  initFilters,
  initGlobalFilters,
  writeFilters,
  writeGlobalFilters,
} from "./lib/filters.js";
import { initTypesIDs, writeTypesIDs } from "./lib/types-ids.js";
import { initDict, writeDict } from "./lib/dicts.js";
import { initRegions, writeRegions } from "./lib/regions.js";
import { IconLibrary, PersistentLevel } from "./satisfactory.types.js";
import { Node } from "./types.js";

initDirs(
  String.raw`C:\dev\Satisfactory\Extracted\Data\FactoryGame\Content`,
  String.raw`C:\dev\Satisfactory\Extracted\Texture\FactoryGame\Content`,
  String.raw`C:\dev\the-hidden-gaming-lair\static\satisfactory`,
);

const nodes = initNodes();
const filters = initFilters();
const enDict = initDict();
const typeIds = initTypesIDs();
const regions = initRegions();
const globalFilters = initGlobalFilters();

const mapImages = await readDirSync(
  TEXTURE_DIR + "/FactoryGame/Interface/UI/Assets/MapTest/SlicedMap",
).map(
  (file) =>
    TEXTURE_DIR + "/FactoryGame/Interface/UI/Assets/MapTest/SlicedMap/" + file,
);

const mapName = "world";
const tmpMapPath = `${TEMP_DIR}/${mapName}.png`;
if (Bun.argv.includes("--tiles")) {
  await arrayJoinImages(mapImages, /_(-?\d+)-(-?\d+)/, tmpMapPath);
}

const iconLibrary = await readJSON<IconLibrary>(
  CONTENT_DIR + "/FactoryGame/-Shared/Blueprint/IconLibrary.json",
);

const persistentLevel = await readJSON<PersistentLevel>(
  CONTENT_DIR + "/FactoryGame/Map/GameLevel01/Persistent_Level.json",
);

const newSceneCaptureComponent2D = persistentLevel.find(
  (l) => l.Name === "NewSceneCaptureComponent2D",
);
if (!newSceneCaptureComponent2D) {
  throw new Error("NewSceneCaptureComponent2D not found");
}

const orthoWidth = newSceneCaptureComponent2D.Properties.OrthoWidth; // 750000
const TILE_WIDTH = 512;
const tiles = initTiles();
tiles[mapName] = (
  await generateTiles(mapName, tmpMapPath, orthoWidth, TILE_WIDTH, [50000, 0])
)[mapName];

const matchRessource = new RegExp("(?<=Desc_)[^.]+");
const ressourceDefinition = [
  { key: "OreIron", title: "Iron Ore" },
  { key: "Stone", title: "Stone" },
  { key: "OreCopper", title: "wip" },
  { key: "OreGold", title: "wip" },
  { key: "LiquidOil", title: "wip" },
  { key: "SAM", title: "wip" },
  { key: "Coal", title: "wip" },
  { key: "RawQuartz", title: "wip" },
  { key: "OreBauxite", title: "wip" },
  { key: "Sulfur", title: "wip" },
  { key: "NitrogenGas", title: "wip" },
  { key: "Water", title: "wip" },
  { key: "OreCaterium", title: "wip" },
];

const isRessourceObjectPath = (s: string) => {
  const match = matchRessource.exec(s);
  if (!match) return;
  return ressourceDefinition.map((def) => def.key).includes(match[0]);
};

for (const actor of persistentLevel) {
  let type;
  let group;
  let iconPath;
  const iconProps: IconProps = {
    outline: true,
  };
  let title;
  let desc;
  let typeId;
  let size = 1.1;

  if (actor.Type === "BP_ResourceNode_C") {
    const assetPath = actor.Properties.mResourceClass.ObjectPath.split(".")[0];
    typeId = assetPath.split("/").pop();

    group = "resources";
    enDict[group] = "Resources";
    if (actor.Properties.mResourceClass.ObjectPath.includes("OreIron")) {
      type = "OreIron";
      title = "Iron Ore";
      iconProps.circle = true;
      iconProps.color = "#ddd";

      const icon = iconLibrary[0].Properties.mIconData.find((i) =>
        i.ItemDescriptor.AssetPathName.startsWith(assetPath),
      );
      if (!icon) {
        throw new Error("Icon not found");
      }
      iconPath =
        icon.Texture.AssetPathName.replace("/Game", "").split(".")[0] + ".png";
    } else {
      continue;
    }
    if (actor.Properties.mPurity) {
      type += "_" + actor.Properties.mPurity;
      if (actor.Properties.mPurity === "RP_Pure") {
        title += " (P)";
        desc = "Pure";
        iconProps.color = "#54c59f";
      } else if (actor.Properties.mPurity === "RP_Inpure") {
        title += " (C)";
        desc = "Impure";
        iconProps.color = "#c79250";
      }
    }
  } else {
    continue;
  }

  enDict[type] = title;
  if (desc) {
    enDict[type + "_desc"] = desc;
  }
  if (!filters.some((f) => f.group === group)) {
    filters.push({ group, defaultOn: true, defaultOpen: true, values: [] });
  }
  const filter = filters.find((f) => f.group === group)!;
  if (!filter.values.some((v) => v.id === type)) {
    const icon = await addToIconSprite(iconPath, type, iconProps);
    filter.values.push({ id: type, icon, size });
  }

  if (!nodes.some((n) => n.type === type && n.mapName === mapName)) {
    nodes.push({
      type,
      mapName,
      spawns: [],
    });
  }
  const spawns = nodes.find(
    (n) => n.type === type && n.mapName === mapName,
  )!.spawns;

  const boxIndex = actor.Properties.mBoxComponent.ObjectPath.split(".").pop();
  const boxActor = persistentLevel[boxIndex];

  const spawn: Node["spawns"][number] = {
    p: [
      boxActor.Properties.RelativeLocation.Y,
      boxActor.Properties.RelativeLocation.X,
      boxActor.Properties.RelativeLocation.Z,
    ],
  };
  spawns.push(spawn);
}

await saveIconSprite(filters, nodes);
writeTiles(tiles);
writeTypesIDs(typeIds);
writeDict(enDict, "en");
writeNodes(nodes);
writeFilters(filters);
writeGlobalFilters(globalFilters);
Object.keys(tiles).forEach((mapName) => {
  encodeToFile(
    OUTPUT_DIR + `/coordinates/cbor/${mapName}.cbor`,
    nodes.filter((n) => !n.mapName || n.mapName === mapName),
  );
});
writeRegions(regions);
console.log("Done!");
