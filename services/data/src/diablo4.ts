import { initDirs, TEMP_DIR, TEXTURE_DIR } from "./lib/dirs.js";
import { readDirSync, saveImage } from "./lib/fs.js";
import { mergeImages } from "./lib/image.js";

initDirs(
  "/mnt/c/dev/Diablo IV/d4data/json",
  "/mnt/c/dev/Diablo IV/d4-texture-extractor/png",
  "/home/devleon/the-hidden-gaming-lair/static/diablo4",
);

if (Bun.env.TILES === "true") {
  const mapImages = await readDirSync(TEXTURE_DIR).filter(
    (f) => f.startsWith("zmap_") && f.match(/_\d\d_\d\d.png$/),
  );
  const mapImagesByName = mapImages.reduce(
    (acc, f) => {
      const mapName = f.match(/(.+)_\d\d_\d\d.png$/)![1];
      const fileName = TEXTURE_DIR + "/" + f;
      if (!acc[mapName]) {
        acc[mapName] = [];
      }
      acc[mapName].push(fileName);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  for (const [mapName, images] of Object.entries(mapImagesByName)) {
    const mapImage = await mergeImages(
      images,
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
