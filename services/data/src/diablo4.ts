import { initDirs, TEMP_DIR, TEXTURE_DIR } from "./lib/dirs.js";
import { readDirSync, saveImage } from "./lib/fs.js";
import { arrayJoinImages, mergeImages } from "./lib/image.js";

initDirs(
  String.raw`C:\dev\DiabloIV\d4data\json`,
  String.raw`C:\dev\DiabloIV\d4-texture-extractor\png`,
  String.raw`../../../static/diablo4`,
);

if (Bun.argv.includes("--tiles")) {
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
    await arrayJoinImages(
      images,
      /_(-?\d+)_(-?\d+)/,
      `${TEMP_DIR}/${mapName}.png`,
    );
  }
}
