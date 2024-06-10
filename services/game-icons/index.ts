import { $ } from "bun";
import fs from "node:fs";
import path from "node:path";

// 1: Open https://game-icons.net/tags.html
// 2: copy([...document.querySelectorAll('.parent')].map(a => [...a.children].map(b => ({ tag: b.href.replace('https://game-icons.net/tags/', '').replace('.html', ''), name: b.innerText.split('—')[0].trim() }))))
const TAGS = [
  [
    {
      tag: "abstract",
      name: "Abstract",
    },
    {
      tag: "cross",
      name: "Cross",
    },
    {
      tag: "gui",
      name: "GUI",
    },
    {
      tag: "star",
      name: "Star & Sun",
    },
    {
      tag: "symbol",
      name: "Symbol & Emblem",
    },
  ],
  [
    {
      tag: "animal",
      name: "Animal",
    },
    {
      tag: "bird",
      name: "Bird",
    },
    {
      tag: "claw",
      name: "Claw",
    },
    {
      tag: "fish",
      name: "Fish",
    },
    {
      tag: "insect",
      name: "Insect & Spider",
    },
    {
      tag: "mammal",
      name: "Mammal",
    },
    {
      tag: "reptile",
      name: "Reptile",
    },
    {
      tag: "shell",
      name: "Shell",
    },
    {
      tag: "tentacle",
      name: "Tentacle",
    },
    {
      tag: "wing",
      name: "Wing",
    },
  ],
  [
    {
      tag: "board",
      name: "Board & Card",
    },
    {
      tag: "arimaa",
      name: "Arimaa",
    },
    {
      tag: "cluedo",
      name: "Cluedo",
    },
    {
      tag: "dice",
      name: "Dice",
    },
    {
      tag: "catan",
      name: "Settlers of Catan",
    },
    {
      tag: "toy",
      name: "Toy",
    },
  ],
  [
    {
      tag: "body",
      name: "Body",
    },
    {
      tag: "anatomy",
      name: "Anatomy",
    },
    {
      tag: "blood",
      name: "Blood & Wound",
    },
    {
      tag: "bone",
      name: "Bone",
    },
    {
      tag: "eye",
      name: "Eye",
    },
    {
      tag: "hand",
      name: "Hand",
    },
    {
      tag: "head",
      name: "Head & Face",
    },
    {
      tag: "heart",
      name: "Heart",
    },
    {
      tag: "mouth",
      name: "Mouth & Jaw",
    },
    {
      tag: "skull",
      name: "Skull",
    },
  ],
  [
    {
      tag: "building",
      name: "Building & Place",
    },
    {
      tag: "bridge",
      name: "Bridge",
    },
    {
      tag: "door",
      name: "Door & Gate",
    },
    {
      tag: "tower",
      name: "Tower",
    },
  ],
  [
    {
      tag: "chemical",
      name: "Chemical",
    },
    {
      tag: "liquid",
      name: "Liquid",
    },
    {
      tag: "poison",
      name: "Poison",
    },
    {
      tag: "smoke",
      name: "Smoke",
    },
  ],
  [
    {
      tag: "cinema",
      name: "Cinema",
    },
    {
      tag: "circus",
      name: "Circus",
    },
    {
      tag: "game-of-thrones",
      name: "Game of Thrones",
    },
    {
      tag: "ninja",
      name: "Ninja",
    },
    {
      tag: "pirate",
      name: "Pirate",
    },
    {
      tag: "police",
      name: "Police & Crime",
    },
    {
      tag: "science-fiction",
      name: "Science fiction",
    },
    {
      tag: "steampunk",
      name: "Steampunk",
    },
  ],
  [
    {
      tag: "civilization",
      name: "Civilization",
    },
    {
      tag: "egypt",
      name: "Ancient Egypt",
    },
    {
      tag: "greek-roman",
      name: "Ancient Greece & Roman Empire",
    },
    {
      tag: "celtic",
      name: "Celtic",
    },
    {
      tag: "statue",
      name: "Statue",
    },
    {
      tag: "stone-age",
      name: "Stone Age",
    },
    {
      tag: "viking",
      name: "Viking",
    },
    {
      tag: "western",
      name: "Western",
    },
    {
      tag: "world-wars",
      name: "World wars",
    },
  ],
  [
    {
      tag: "clothing",
      name: "Clothing",
    },
    {
      tag: "armor",
      name: "Armor",
    },
    {
      tag: "boot",
      name: "Boot & Shoe",
    },
    {
      tag: "hat",
      name: "Hat, Helmet & Crown",
    },
    {
      tag: "mask",
      name: "Mask",
    },
    {
      tag: "jewellery",
      name: "Ring & Jewellery",
    },
  ],
  [
    {
      tag: "creature",
      name: "Creature & Monster",
    },
    {
      tag: "death",
      name: "Death",
    },
    {
      tag: "medieval-fantasy",
      name: "Medieval fantasy characters",
    },
    {
      tag: "vampire",
      name: "Vampire",
    },
    {
      tag: "zombie",
      name: "Zombie",
    },
  ],
  [
    {
      tag: "food",
      name: "Food",
    },
    {
      tag: "bottle",
      name: "Bottle",
    },
    {
      tag: "egg",
      name: "Egg",
    },
    {
      tag: "fruit",
      name: "Fruit & Vegetable",
    },
    {
      tag: "glass",
      name: "Glass",
    },
    {
      tag: "kitchenware",
      name: "Kitchenware",
    },
    {
      tag: "meat",
      name: "Meat",
    },
  ],
  [
    {
      tag: "machine",
      name: "Machine",
    },
    {
      tag: "boat",
      name: "Boat",
    },
    {
      tag: "electronic",
      name: "Electronic device",
    },
    {
      tag: "energy",
      name: "Energy",
    },
    {
      tag: "robot",
      name: "Robot",
    },
    {
      tag: "tool",
      name: "Tool",
    },
    {
      tag: "vehicle",
      name: "Vehicle",
    },
  ],
  [
    {
      tag: "map",
      name: "Map & Country",
    },
    {
      tag: "australia",
      name: "Australia",
    },
    {
      tag: "france",
      name: "France",
    },
    {
      tag: "mexico",
      name: "Mexico",
    },
  ],
  [
    {
      tag: "nature",
      name: "Nature",
    },
    {
      tag: "fire",
      name: "Fire",
    },
    {
      tag: "ice",
      name: "Ice",
    },
    {
      tag: "lightning",
      name: "Lightning",
    },
    {
      tag: "metal",
      name: "Metal",
    },
    {
      tag: "mineral",
      name: "Mineral",
    },
    {
      tag: "mushroom",
      name: "Mushroom",
    },
    {
      tag: "plant",
      name: "Plant",
    },
    {
      tag: "sea",
      name: "Sea",
    },
    {
      tag: "sky",
      name: "Sky & Weather",
    },
    {
      tag: "space",
      name: "Space",
    },
    {
      tag: "stone",
      name: "Stone",
    },
    {
      tag: "wood",
      name: "Wood & Tree",
    },
  ],
  [
    {
      tag: "office",
      name: "Office",
    },
    {
      tag: "book",
      name: "Book",
    },
  ],
  [
    {
      tag: "sound",
      name: "Sound & Music",
    },
    {
      tag: "musical-instrument",
      name: "Musical instrument",
    },
  ],
  [
    {
      tag: "video-game",
      name: "Video game",
    },
    {
      tag: "super-mario",
      name: "Super Mario",
    },
    {
      tag: "zelda",
      name: "Zelda",
    },
  ],
  [
    {
      tag: "weapon",
      name: "Weapon",
    },
    {
      tag: "arrow",
      name: "Arrow & Spear",
    },
    {
      tag: "axe",
      name: "Axe",
    },
    {
      tag: "blade",
      name: "Blade, Sword & Knife",
    },
    {
      tag: "bomb",
      name: "Bomb",
    },
    {
      tag: "explosion",
      name: "Explosion & Projectile",
    },
    {
      tag: "gun",
      name: "Gun & Firearm",
    },
    {
      tag: "shield",
      name: "Shield",
    },
    {
      tag: "target",
      name: "Target",
    },
  ],
];
const icons: {
  tag: string;
  icons: {
    name: string;
    url: string;
    author: string;
  }[];
}[][] = [];

for (const tags of TAGS) {
  const items: {
    tag: string;
    icons: {
      name: string;
      url: string;
      author: string;
    }[];
  }[] = [];

  for (const tag of tags) {
    // await downloadAndUnzip(tag.tag);
    const itemIcons: {
      name: string;
      url: string;
      author: string;
    }[] = [];
    for (const icon of readDirRecursive(`icons/${tag.tag}`)) {
      const matched = icon.match(
        /icons\/(.+?)\/icons\/ffffff\/transparent\/1x1\/(.+?)\/(.+?)\.png/,
      );
      if (!matched) {
        console.warn("No match for", icon);
        continue;
      }
      const [, tag, author, name] = matched;
      itemIcons.push({
        name: capitalizeString(name),
        url: `/global_icons/game-icons/${name}_${author}.webp`,
        author: capitalizeString(author),
      });
      //   await $`cwebp ${icon} -resize 64 64 -o ../../static/global/icons/game-icons/${name}_${author}.webp`;
    }
    items.push({
      tag: tag.name,
      icons: itemIcons,
    });
  }
  icons.push(items);
}

await Bun.write(
  "../../packages/ui/src/components/(controls)/icons.json",
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
  await $`wget https://game-icons.net/archives/png/zip/ffffff/transparent/${tag}.png.zip`;
  await $`unzip ${tag}.png.zip -d icons/${tag}`;
  await $`rm ${tag}.png.zip`;
}

function readDirRecursive(filePath: string, extension?: string) {
  const paths = fs.readdirSync(path.resolve(__dirname, filePath), {
    withFileTypes: true,
  });
  const files = paths
    .filter(
      (dirent) =>
        dirent.isFile() && (!extension || dirent.name.endsWith(extension)),
    )
    .map((dirent) => path.join(filePath, dirent.name));
  const dirs = paths.filter((dirent) => dirent.isDirectory());
  dirs.forEach((dir) => {
    files.push(...readDirRecursive(filePath + "/" + dir.name, extension));
  });
  return files;
}
