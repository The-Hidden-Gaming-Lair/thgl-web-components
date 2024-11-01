import { spawn, write } from "bun";
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
import { Actor, ActorType, IconLibrary, PersistentLevel, RelevantActors, RessourceActor, ShrineActor } from "./satisfactory.types.js";
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

const generatedFileHandles = readDirSync(
  CONTENT_DIR + "/FactoryGame/Map/GameLevel01/Persistent_Level/_Generated_",
);


// satisfactory uses streaming file to load additional data
const relevantActors = ["SomerSloopShrine", "MercerShrine"]
console.log(`Loading ${generatedFileHandles.length} generated files`)
// patch all generated files together, map down onto keys
console.time("Generated file load")
const generatedFiles = await Promise.all(generatedFileHandles.map((fileName) => readJSON<PersistentLevel>(
  CONTENT_DIR + `/FactoryGame/Map/GameLevel01/Persistent_Level/_Generated_/${fileName}`,
)))
console.timeEnd("Generated file load")
// append all relevant actors to persistentlevel
generatedFiles.forEach((level) => {
  level.forEach((actor) => {
    if (actor.Type === "BP_MercerShrine_C") {
      persistentLevel.push(actor);
    }

    if (actor.Type === "BP_SomerSloopShrine_C") {
      persistentLevel.push(actor);
    }

    if (actor.Type === "BP_DropPod_C") {
      persistentLevel.push(actor);
    }
  })
})

const worldscanner = persistentLevel.find(l => l.Type === " )

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

const matchRessources = new RegExp("(?<=Desc_)[^.]+");
const matchShrines = new RegExp("(?<=BP_)[^.]+");
const ressourceDefinition = [
  { key: "OreIron", title: "Iron Ore", group: "ressources" },
  { key: "Stone", title: "Limestone", group: "ressources" },
  { key: "OreCopper", title: "Copper Ore", group: "ressources" },
  { key: "OreGold", title: "Gold Ore", group: "ressources" },
  { key: "OreUranium", title: "Uranium Ore", group: "ressources" },
  { key: "LiquidOil", title: "Crude Oil", group: "ressources" },
  { key: "SAM", title: "S.A.M. ORE", group: "ressources" },
  { key: "Coal", title: "Coal", group: "ressources" },
  { key: "RawQuartz", title: "Quartz", group: "ressources" },
  { key: "OreBauxite", title: "Bauxite Ore", group: "ressources" },
  { key: "Sulfur", title: "Sulfur", group: "ressources" },
  { key: "NitrogenGas", title: "Nitrogen", group: "ressources" },
  { key: "Water", title: "Water", group: "ressources" },
  { key: "OreCaterium", title: "Caterium Ore", group: "ressources" },
  { key: "SomerSloopShrine", title: "Somersloop", iconId: 817, group: "artifacts" },
  { key: "MercerShrine", title: "Mercer Sphere", iconId: 816, group: "artifacts" },
  { key: "DropPod", title: "Hard Drive", iconPath: "", group: "collectibles" }
];

const getRessourceObjectDefinition = (s: string) => {
  const match = matchRessources.exec(s) ?? matchShrines.exec(s);
  if (match) {
    return ressourceDefinition.find((def) => def.key === match[0])
  };
  return;
};

const getAssetPath = (actor: RelevantActors) => {
  switch (actor.Type) {
    case "BP_ResourceNode_C":
      return actor.Properties.mResourceClass.ObjectPath;
    case "BP_DropPod_C":
    case "BP_MercerShrine_C":
    case "BP_SomerSloopShrine_C":
      return actor.Template.ObjectPath;
  }
};

const getPosition = (actor: RelevantActors) => {
  switch (actor.Type) {
    case "BP_ResourceNode_C":
      const boxIndex = actor.Properties.mBoxComponent.ObjectPath.split(".").pop();
      const boxActor = persistentLevel[boxIndex];
      return boxActor.Properties.RelativeLocation;
    case "BP_MercerShrine_C":
    case "BP_DropPod_C":
    case "BP_SomerSloopShrine_C": {
      if (actor.Properties.CachedActorTransform)
        return actor.Properties.CachedActorTransform.Translation;      
    }
  }
};

const isRelevantActor = (actor: Actor): actor is RelevantActors => {
  return RelevantActors.includes(actor.Type as ActorType);
}

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

  if (!isRelevantActor(actor)) {
    continue;
  }

  const basePath = getAssetPath(actor);

  const assetPath = basePath.split(".")[0];
  typeId = assetPath.split("/").pop();

  group = "resources";
  enDict[group] = "Resources";
  const definition = getRessourceObjectDefinition(basePath);
  if (definition) {
    type = definition.key;
    title = definition.title;
    iconProps.circle = true;
    iconProps.color = "#ddd";

    const icon = iconLibrary[0].Properties.mIconData.find((i) =>
      i.ItemDescriptor.AssetPathName.startsWith(assetPath) || i.ID === definition.iconId,
    );



    iconPath = icon ?
      icon.Texture.AssetPathName.replace("/Game", "").split(".")[0] + ".png" : definition.iconPath;
  } else {
    console.log("Unhandled definition", actor.Type)
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


  enDict[type] = title;
  if (desc) {
    enDict[type + "_desc"] = desc;
  }
  if (!filters.some((f) => f.group === group)) {
    filters.push({ group, defaultOn: true, defaultOpen: true, values: [] });
  }
  const filter = filters.find((f) => f.group === group)!;
  if (!filter.values.some((v) => v.id === type)) {
    if (!iconPath) {
      filter.values.push({ id: type, icon: { height: 20, url: "", width: 20, x: 0, y: 0 }, size })
    } else {
      const icon = await addToIconSprite(iconPath, type, iconProps);
      filter.values.push({ id: type, icon, size });
    }
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



  const location = getPosition(actor);
  if (!location) continue;
  const spawn: Node["spawns"][number] = {
    p: [
      location.Y,
      location.X,
      location.Z,
    ],
  };
  spawns.push(spawn);
}

const sommerSloopTest = {
  "X": 44929.69,
  "Y": -12105.648,
  "Z": 23145.809
}

nodes.push({
  type: "Test",
  mapName,
  spawns: [{ p: [sommerSloopTest.Y, sommerSloopTest.X, sommerSloopTest.Z] }],
});


filters.push({ group: "Test", defaultOn: true, defaultOpen: true, values: [{ id: "Test", icon: { height: 20, url: "", width: 20, x: 0, y: 0 } }] });

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

console.log(`spawns ${nodes.map(node => node.spawns.length).reduce((acc, num) => acc += num, 0)}`)
console.log("Done!");
