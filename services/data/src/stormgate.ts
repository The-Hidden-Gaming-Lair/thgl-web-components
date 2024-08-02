import { createCanvas } from "@napi-rs/canvas";
import { CONTENT_DIR, initDirs, TEMP_DIR } from "./lib/dirs.js";
import { readJSON, saveImage } from "./lib/fs.js";
import { mirrorCancas, rotateCanvas } from "./lib/image.js";

initDirs(
  "/mnt/c/dev/Stormgate/Extracted/Data",
  "/mnt/c/dev/Stormgate/Extracted/Texture",
  "/home/devleon/the-hidden-gaming-lair/static/stormgate",
);

// const mapName = "Vanguard01";
const mapName = "Boneyard";

const map = await readJSON<Map>(
  `${CONTENT_DIR}/Stormgate/Content/PublishedMaps/${mapName}/Runtime/map.json`,
);
const details = await readJSON<Details>(
  `${CONTENT_DIR}/Stormgate/Content/PublishedMaps/${mapName}/Runtime/${map.__attr.details.__fref}`,
);
const terrain = await readJSON<Terrain>(
  `${CONTENT_DIR}/Stormgate/Content/PublishedMaps/${mapName}/Runtime/${map.__attr.terrain.__fref}`,
);
createMapImage(terrain, details.dimensions[0], details.dimensions[1], mapName);

async function createMapImage(
  terrain: Terrain,
  width: number,
  height: number,
  mapName: string,
) {
  const terrainNodesSize = Math.sqrt(terrain.terrain_nodes.length);
  const terrainNodesCanvas = createCanvas(terrainNodesSize, terrainNodesSize);
  const terrainNodesCtx = terrainNodesCanvas.getContext("2d");
  for (let i = 0; i < terrain.terrain_nodes.length; i++) {
    const terrainNode = terrain.terrain_nodes[i];
    const x = i % terrainNodesSize;
    const y = Math.floor(i / terrainNodesSize);
    if (terrainNode === 8) {
      terrainNodesCtx.fillStyle = `rgba(89,145,223,1)`;
    } else if (terrainNode === 9) {
      terrainNodesCtx.fillStyle = `rgba(41,30,20,1)`;
    } else if (terrainNode === 10) {
      terrainNodesCtx.fillStyle = `rgba(93,68,45,1)`;
    } else if (terrainNode === 11) {
      terrainNodesCtx.fillStyle = `rgba(168,121,82,1)`;
    } else if (terrainNode === 12) {
      terrainNodesCtx.fillStyle = `rgba(91,56,33,1)`;
    } else {
      terrainNodesCtx.fillStyle = `rgba(${terrainNode}, ${terrainNode}, ${terrainNode}, 1)`;
    }
    terrainNodesCtx.fillRect(x, y, 1, 1);
  }
  saveImage(
    TEMP_DIR + "/" + mapName + "_terrain_nodes.png",
    mirrorCancas(terrainNodesCanvas).toBuffer("image/png"),
  );

  const waterDataSize = Math.sqrt(terrain.water_data.length);
  const waterDataCanvas = createCanvas(waterDataSize, waterDataSize);
  const waterDataCtx = waterDataCanvas.getContext("2d");
  for (let i = 0; i < terrain.water_data.length; i++) {
    const waterNode = terrain.water_data[i];
    const x = i % waterDataSize;
    const y = Math.floor(i / waterDataSize);
    waterDataCtx.fillStyle = `rgba(${waterNode}, ${waterNode}, ${waterNode}, 1)`;
    waterDataCtx.fillRect(x, y, 1, 1);
  }
  const waterDataImageData = waterDataCtx.getImageData(
    0,
    0,
    waterDataSize,
    waterDataSize,
  );
  saveImage(
    TEMP_DIR + "/" + mapName + "_water_data.png",
    mirrorCancas(waterDataCanvas).toBuffer("image/png"),
  );

  const heightNodesSize = Math.sqrt(terrain.height_nodes.length);
  const heightNodesCanvas = createCanvas(heightNodesSize, heightNodesSize);
  const heightNodesCtx = heightNodesCanvas.getContext("2d");
  for (let i = 0; i < terrain.height_nodes.length; i++) {
    const heightNode = Math.max(terrain.height_nodes[i], 256);
    const x = i % heightNodesSize;
    const y = Math.floor(i / heightNodesSize);
    heightNodesCtx.fillStyle = `rgba(${heightNode}, ${heightNode}, ${heightNode}, 1)`;
    heightNodesCtx.fillRect(x, y, 1, 1);
  }
  saveImage(
    TEMP_DIR + "/" + mapName + "_height_nodes.png",
    mirrorCancas(heightNodesCanvas).toBuffer("image/png"),
  );

  const canvas = createCanvas(waterDataSize, waterDataSize);
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, waterDataSize, waterDataSize);
  const pixels = imageData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const j = i / 4;
    // const x = (i / 4) % width;
    // const y = Math.floor(i / 4 / width);
    const terrainNode = terrain.terrain_nodes[j];
    const waterNode = terrain.water_data[j];
    const heightNode = terrain.height_nodes[j];

    const isWater = waterDataImageData.data[i] > 0;

    if (isWater) {
      pixels[i] = 5;
      pixels[i + 1] = 49;
      pixels[i + 2] = 140;
      pixels[i + 3] = 255;
    } else {
      pixels[i] = 0;
      pixels[i + 1] = 0;
      pixels[i + 2] = 0;
      pixels[i + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  saveImage(
    TEMP_DIR + "/" + mapName + ".png",
    mirrorCancas(canvas).toBuffer("image/png"),
  );
}
/**
 * Here are the missions/maps that are available in the game.
 * I think, I can generated the minimap from this data.
 * C:\dev\Stormgate\Extracted\Data\Stormgate\Content\PublishedMaps\Vanguard01
 *
 */

/**
 * The runtime_session has all the actors and stats.
 * C:\dev\Stormgate\Extracted\Data\Stormgate\Content\PublishedCatalogs\pegasus_1v1\Runtime\runtime_session.json
 */

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
