import { initDirs, TEMP_DIR, TEXTURE_DIR } from "./lib/dirs.js";
import { readDirSync, saveImage } from "./lib/fs.js";
import { mergeImages } from "./lib/image.js";

initDirs(
  "/mnt/c/dev/Diablo IV/d4data/json",
  "/mnt/c/dev/Diablo IV/d4-texture-extractor/png",
  "/home/devleon/the-hidden-gaming-lair/static/diablo4",
);

if (Bun.env.TILES === "true") {
  const mapFilters = [
    "zmap_Frac_Underworld_",
    "zmap_Kehj_Hell_",
    "zmap_Kehj_Hell_Sightless_Eye_",
    "zmap_Sanctuary_Eastern_Continent_",
  ];
  for (const mapFilter of mapFilters) {
    const mapName = mapFilter.split("_")[1];
    const mapTiles = await readDirSync(TEXTURE_DIR)
      .filter((f) => f.startsWith(mapFilter) && !f.includes("cc"))
      .map((f) => TEXTURE_DIR + "/" + f);
    const mapImage = await mergeImages(
      mapTiles,
      /_(-?\d+)_(-?\d+)/,
      "#101010",
      true,
    );
    saveImage(
      TEMP_DIR + "/" + mapName + ".png",
      mapImage.toBuffer("image/png"),
    );
  }
}
