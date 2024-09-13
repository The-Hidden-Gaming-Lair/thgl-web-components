import { $ } from "bun";
import { readDirRecursive } from "./lib/fs.js";

const DATA_PATH = "/mnt/c/dev/New World/Data";
const TEXTURE_DIR = "/mnt/c/dev/New World/Textures";
const OUTPUT_DIR = "/home/devleon/aeternum-map/apps/api/public/ptr";

// await $`/mnt/c/dev/New\ World/texconv.exe -y -r:keep 'C:\dev\New World\Textures\worldtiles\*.dds' -ft png -o 'C:\dev\New World\Textures\worldtiles'`;
console.log("Converted DDS to PNG");
for (const file of readDirRecursive(TEXTURE_DIR + "/worldtiles")) {
  try {
    if (file.endsWith(".png")) {
      const outFile = file
        .replace(TEXTURE_DIR + "/worldtiles", OUTPUT_DIR)
        .replace(".png", ".webp");
      await $`cwebp "${file}" -m 6 -o "${outFile}" -quiet`;
    }
  } catch (e) {
    console.error(`Failed to convert ${file}`);
  }
}
