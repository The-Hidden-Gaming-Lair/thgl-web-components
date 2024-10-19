import { $ } from "bun";
import fs from "node:fs";
import path from "node:path";
import TAGS from "./game-icons.tags.json";
import { TEMP_DIR } from "./lib/dirs.js";
import yauzl from "yauzl";
import { createImageSprite, SpritePaths } from "./lib/image.js";
import { cpFile, readDirRecursive, saveImage } from "./lib/fs.js";

// 1: Open https://game-icons.net/tags.html
// 2: copy([...document.querySelectorAll('li a[href^="/tags"]')].map(b => ({ tag: b.href.replace('https://game-icons.net/tags/', '').replace('.html', ''), name: b.innerText.split('—')[0].trim() })))
// 3: paste in game-icons.tags.json

const icons: {
  tag: string;
  icons: {
    name: string;
    url: string;
    author: string;
  }[];
}[][] = [];

const items: {
  tag: string;
  icons: {
    name: string;
    url: string;
    author: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
}[] = [];

for (const tag of TAGS) {
  await downloadAndUnzip(tag.tag);
  const itemIcons: {
    name: string;
    url: string;
    author: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[] = [];
  const spritePaths: SpritePaths = [];
  for (const icon of readDirRecursive(`${TEMP_DIR}/icons/${tag.tag}`)) {
    if (icon.endsWith("license.txt")) {
      continue;
    }
    const matched = icon.match(
      /icons\\(.+?)\\icons\\ffffff\\transparent\\1x1\\(.+?)\\(.+?)\.png/,
    );
    if (!matched) {
      console.warn("No match for", icon);
      continue;
    }
    const [, , author, name] = matched;
    spritePaths.push({
      name: capitalizeString(name),
      imagePath: icon,
    });

    // copy this icon to game-icons folder
    cpFile(icon, `${TEMP_DIR}\\game-icons\\${name}_${author}.png`);

    itemIcons.push({
      name: capitalizeString(name),
      url: `/global_icons/game-icons/${tag.tag}.webp`,
      author: capitalizeString(author),
      x: 0,
      y: 0,
      width: 64,
      height: 64,
    });
    //   await $`cwebp ${icon} -resize 64 64 -m 6 -o ../../static/global/icons/game-icons/${name}_${author}.webp -quiet`;
  }
  const imageSprite = await createImageSprite(spritePaths, 64, 64);
  const tempFileName = `${TEMP_DIR}/icons/${tag.tag}/sprite.png`;
  saveImage(tempFileName, imageSprite.canvas.toBuffer("image/png"));
  const outFilename = `C:\\dev\\the-hidden-gaming-lair\\static\\global\\icons\\game-icons\\${tag.tag}.webp`;
  await $`cwebp ${tempFileName} -m 6 -o ${outFilename} -quiet`;

  for (const sprite of imageSprite.imageSprite) {
    const itemIcon = itemIcons.find((icon) => icon.name === sprite.name);
    if (!itemIcon) {
      throw new Error("No icon found for " + sprite.name);
    }
    itemIcon.x = sprite.x;
    itemIcon.y = sprite.y;
  }
  items.push({
    tag: tag.name,
    icons: itemIcons,
  });
  console.log(`${tag.name} processed`);
}
icons.push(items);

await Bun.write(
  `C:\\dev\\the-hidden-gaming-lair\\packages\\ui\\src\\components\\(controls)\\icons.json`,
  JSON.stringify(icons, null, 2),
);

function capitalizeString(str: string) {
  let result = str.replace(/-/g, " ");
  result = result.replace(/(\w)(\w*)/g, function (g0, g1, g2) {
    return g1.toUpperCase() + g2.toLowerCase();
  });
  return result;
}

async function downloadAndUnzip(tag: string) {
  return new Promise<void>(async (resolve, reject) => {
    const response = await fetch(
      `https://game-icons.net/archives/png/zip/ffffff/transparent/${tag}.png.zip`,
    );
    const fileName = `${TEMP_DIR}/${tag}.png.zip`;
    await Bun.write(fileName, response);

    yauzl.open(fileName, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        reject(err);
      }
      // Read each entry (file) in the ZIP
      zipfile.readEntry();
      zipfile.on("entry", (entry) => {
        // console.log(`File found: ${entry.fileName}`);

        if (/\\$/.test(entry.fileName)) {
          // Directory file names end with '/'.
          // Note that entries for directories themselves are optional.
          // An entry's fileName implicitly requires its parent directories to exist.
          zipfile.readEntry();
        } else {
          // file entry
          zipfile.openReadStream(entry, async function (err, readStream) {
            if (err) throw err;
            readStream.on("end", function () {
              zipfile.readEntry();
            });

            const outFileName = `${TEMP_DIR}/icons/${tag}/${entry.fileName}`;
            const outFolder = path.dirname(outFileName);
            await $`mkdir -p ${outFolder}`;

            const writeStream = fs.createWriteStream(outFileName);
            readStream.pipe(writeStream);
          });
        }
      });

      zipfile.on("error", (err) => {
        console.error(err);
        reject(err);
      });
      zipfile.on("end", () => {
        resolve();
      });
    });
  });
}
