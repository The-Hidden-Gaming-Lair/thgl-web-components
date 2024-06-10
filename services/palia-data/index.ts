import { $ } from "bun";
import { saveImage } from "./lib/fs.js";
import { addCircleToImage } from "./lib/image.js";

const TEXTURE_DIR = "/mnt/c/dev/data-mining/palia/umodel/UmodelExport";
const TEMP_DIR = "/home/devleon/the-hidden-gaming-lair/services/palia-data/out";
const OUT_DIR = "/home/devleon/palia.th.gl";

const savedIcons: string[] = [];
const sapling = "grey";
const small = "green";
const medium = "yellow";
const large = "red";
const icons = [
  "Icon_Ore_Copper",
  "Icon_Ore_Iron",
  "Icon_Ore_Palium",
  "Icon_Stone",
  "Icon_Wood_Softwood",
  "Icon_Wood_Magicwood",
  "Icon_Wood_Hardwood",
];
for (const icon of icons) {
  if (icon.startsWith("Icon_Wood")) {
    await saveIcon(
      `${TEXTURE_DIR}/Game/UI/Icons/${icon}.png`,
      sapling,
      "sapling",
    );
  }
  await saveIcon(`${TEXTURE_DIR}/Game/UI/Icons/${icon}.png`, small, "small");
  await saveIcon(`${TEXTURE_DIR}/Game/UI/Icons/${icon}.png`, medium, "medium");
  await saveIcon(`${TEXTURE_DIR}/Game/UI/Icons/${icon}.png`, large, "large");
}
await saveIcon(
  `/home/devleon/the-hidden-gaming-lair/static/global/icons/game-icons/three-leaves_lorc.webp`,
);
await saveIcon(`${TEXTURE_DIR}/Game/UI/Icons/Icon_Deco_Chapaa_Nest.png`);
async function saveIcon(assetPath: string, color?: string, size?: string) {
  const fileName = assetPath.split("/").at(-1)?.split(".")[0]!;

  const id = fileName + (color ? `_${size}` : "");
  if (savedIcons.includes(id)) {
    return `${id}.webp`;
  }

  if (color) {
    console.log("Saving icon", id, assetPath, color);
    const canvas = await addCircleToImage(assetPath, color);
    saveImage(TEMP_DIR + `/${id}.png`, canvas.toBuffer("image/png"));
    await $`cwebp ${TEMP_DIR}/${id}.png -o ${OUT_DIR}/public/icons/spawn/${id}.webp -short`;
  } else {
    console.log("Saving icon", id, assetPath);
    await $`cwebp ${assetPath} -o ${OUT_DIR}/public/icons/spawn/${id}.webp -short`;
  }

  savedIcons.push(id);
  return `${id}.webp`;
}
