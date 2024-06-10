import { $ } from "bun";
import { readDirRecursive, readJSON, writeJSON } from "./lib/fs.js";
import {
  A_FactionChoices_C,
  BlueprintBase_Hero_C,
  Faction_Protectorate_C,
  RI_Hero_FluffyHero_C,
  Troop_MPHero_Mera_C,
} from "./types.js";

const CONTENT_DIR = "/mnt/c/dev/Zero Space/Extracted/Data";
const TEXTURE_DIR = "/mnt/c/dev/Zero Space/Extracted/Texture";
("/home/devleon/the-hidden-gaming-lair/services/zero-space-data/out");
const OUT_DIR = "/home/devleon/the-hidden-gaming-lair/static/zero-space";
const savedIcons: string[] = [];

const enDict: Record<string, string> = {
  heroes: "Heroes",
  MaxHealth: "Max Health",
  MaxEnergy: "Max Energy",
  MaxShields: "Max Shields",
  ArmorRating: "Armor Rating",
  MoveSpeed: "Speed",
  SightRange: "Vision",
  RegenRateHealth: "Health Regen",
  RegenRateEnergy: "Energy Regen",
  StunResist: "Stun Resistance",
};
const database: {
  type: string;
  items: {
    id: string;
    icon?: string;
    props: Record<string, any>;
    groupId?: string;
  }[];
}[] = [];

const groups: {
  id: string;
  icon: string;
}[] = [];

const aFactionChoices = await readJSON<A_FactionChoices_C>(
  `${CONTENT_DIR}/Zerospace/Content/Nova/Archetypes_Factions/A_FactionChoices.json`,
);

const factionChoices = aFactionChoices.find(
  (f) => f.Type === "A_FactionChoices_C",
);
if (!factionChoices?.Properties) {
  throw new Error("No faction choices found");
}

for (const factionObject of factionChoices.Properties.FactionPool) {
  const faction = await readJSON<Faction_Protectorate_C>(
    `${CONTENT_DIR}/${factionObject.ObjectPath.replace(".0", ".json")}`,
  );
  const groupId = faction[0].Name;
  const deckInfo = faction.find((f) => f.Properties?.DeckInfo)?.Properties
    ?.DeckInfo!;

  const factionName = deckInfo.FactionName;
  const factionPortrait = await saveIcon(
    `${TEXTURE_DIR}/${deckInfo.Portrait.ObjectPath.replace(".0", ".png")}`,
  );
  const factionDesc = deckInfo.FactionDescription.LocalizedString;
  enDict[groupId] = factionName;
  enDict[`${groupId}_desc`] = factionDesc;
  groups.push({
    id: groupId,
    icon: factionPortrait,
  });

  for (const heroObject of deckInfo.Heroes) {
    const hero = await readJSON<RI_Hero_FluffyHero_C>(
      `${CONTENT_DIR}/${heroObject.ObjectPath.replace(".0", ".json")}`,
    );
    const customHeroPathName = hero.find((h) => h.Properties?.GrantProducts)
      ?.Properties?.GrantProducts![0].AssetPathName!;
    const customHero = await readJSON<Troop_MPHero_Mera_C>(
      `${CONTENT_DIR}/${customHeroPathName.replace("/Game", "/Zerospace/Content").split(".")[0]}.json`,
    );
    const customHeroVitals = customHero.find((h) => h.Properties?.Vitals)
      ?.Properties?.Vitals;

    const heroId = customHero[0].Name;
    const heroTitle = customHero.find((h) => h.Properties?.Title)?.Properties
      ?.Title!;
    const heroDescription = customHero.find((h) => h.Properties?.Description)
      ?.Properties?.Description!;
    const heroPortrait = customHero.find((h) => h.Properties?.Portrait)
      ?.Properties?.Portrait!;

    enDict[heroId] = heroTitle;
    enDict[`${heroId}_desc`] = heroDescription;

    const attributes = customHero.find((h) => h.Name === "NovaUnitAttributes")!;
    const [heroTemplatePath, heroTemplateIndex] =
      attributes.Template?.ObjectPath.split(".") as [string, string];
    const heroTemplate = await readJSON<BlueprintBase_Hero_C>(
      `${CONTENT_DIR}/${heroTemplatePath}.json`,
    );
    const heroTemplateVitals = heroTemplate.find((h) => h.Properties?.Vitals)
      ?.Properties?.Vitals!;

    const [unitTemplatePath, unitTemplateIndex] = heroTemplate[
      +heroTemplateIndex
    ].Template?.ObjectPath.split(".") as [string, string];
    const unitTemplate = await readJSON<BlueprintBase_Hero_C>(
      `${CONTENT_DIR}/${unitTemplatePath}.json`,
    );
    const unitTemplateVitals = unitTemplate.find((h) => h.Properties?.Vitals)
      ?.Properties?.Vitals!;

    const heroTemplateCharMove = heroTemplate.find(
      (h) => h.Properties?.MaxWalkSpeed,
    )?.Properties!;
    const unitTemplateCharMove = unitTemplate.find(
      (h) => h.Properties?.MaxWalkSpeed,
    )?.Properties!;

    const props: Record<string, any> = {};

    for (const prop of Object.keys(attributes.Properties!)) {
      if (!enDict[prop]) {
        continue;
      }
      if (prop === "MoveSpeed") {
        props[prop] =
          heroTemplateCharMove.MaxWalkSpeed ??
          unitTemplateCharMove.MaxWalkSpeed;
        continue;
      }
      const customHeroVital = customHeroVitals?.find(
        (v) => v.AttributeName.AttributeName === prop,
      );
      const heroVital = heroTemplateVitals.find(
        (v) => v.AttributeName.AttributeName === prop,
      );
      const unitVital = unitTemplateVitals.find(
        (v) => v.AttributeName.AttributeName === prop,
      );
      const value =
        customHeroVital?.AttributeValue ??
        heroVital?.AttributeValue ??
        unitVital?.AttributeValue ??
        "?";
      props[prop] = value;
    }

    addItemToDatabase("heroes", {
      id: heroId,
      groupId: groupId,
      icon: await saveIcon(
        `${TEXTURE_DIR}/${heroPortrait.ObjectPath.replace(".0", ".png")}`,
      ),
      props: props,
    });
  }
}

for (const mercenaryObject of factionChoices.Properties.MercenaryPool) {
  //
}

writeJSON(OUT_DIR + "/data/database.json", database);
writeJSON(OUT_DIR + "/data/groups.json", groups);
writeJSON(OUT_DIR + "/dicts/en.json", enDict);

// const novaFilenames = await readDirRecursive(
//   `${CONTENT_DIR}/Zerospace/Content`
// );
// for (const novaFilename of novaFilenames) {
//   if (!novaFilename.includes("/Archetype")) {
//     continue;
//   }
//   const fullName = novaFilename.split("/").at(-1)!.replace(".json", "");
//   const type = fullName.split("_")[1];

//   try {
//     if (!novaFilename.endsWith(".json")) {
//       continue;
//     }
//     const id = fullName.replace(".json", "");
//     const archetypesTroop = readJSON<any>(novaFilename);
//     const title = archetypesTroop.find((t) => t.Properties?.Title)?.Properties
//       ?.Title;

//     const description = archetypesTroop.find((t) => t.Properties?.Title)
//       ?.Properties?.Description;

//     if (!title || !description) {
//       console.warn(`No title for ${fullName}`);
//       continue;
//     }
//     enDict[id] = title;
//     enDict[`${id}_desc`] = description;

//     const item: (typeof database)[number]["items"][number] = {
//       id,
//       props: {},
//     };
//     const portrait = archetypesTroop.find((t) => t.Properties?.Portrait)
//       ?.Properties?.Portrait;
//     if (portrait) {
//       item.icon = await saveIcon(
//         `${TEXTURE_DIR}/${portrait.ObjectPath.replace(".0", ".png")}`
//       );
//     }
//     const supplyCost = archetypesTroop.find((t) => t.Properties?.SupplyCost)
//       ?.Properties?.SupplyCost;
//     if (supplyCost) {
//       item.props.supplyCost = supplyCost;
//     }
//     const productionTime = archetypesTroop.find(
//       (t) => t.Properties?.ProductionTime
//     )?.Properties?.ProductionTime;
//     if (productionTime) {
//       item.props.productionTime = productionTime;
//     }
//     const attackWhileMoving = archetypesTroop.find(
//       (t) => typeof t.Properties?.AttackWhileMoving !== "undefined"
//     )?.Properties?.AttackWhileMoving;
//     if (typeof attackWhileMoving !== "undefined") {
//       item.props.attackWhileMoving = attackWhileMoving;
//     }
//     const canAttackGround = archetypesTroop.find(
//       (t) => typeof t.Properties?.bCanAttackGround !== "undefined"
//     )?.Properties?.bCanAttackGround;
//     if (typeof canAttackGround !== "undefined") {
//       item.props.canAttackGround = canAttackGround;
//     }
//     const costs = archetypesTroop
//       .find((t) => t.Properties?.Resources)
//       ?.Properties?.Resources.reduce(
//         (acc, cur) => {
//           const path = cur.Key.split("'")[1].split(".")[0];
//           const key = path.split("/").at(-1);
//           if (!enDict[key]) {
//             const resourceType = readJSON<any>(
//               CONTENT_DIR + "/" + path + ".json"
//             );
//             const resourceTitle = resourceType.find(
//               (t) => t.Properties?.ResourceName?.LocalizedString
//             ).Properties.ResourceName.LocalizedString;
//             enDict[key] = resourceTitle;
//           }
//           acc[key] = cur.Value;
//           return acc;
//         },
//         {} as Record<string, number>
//       );
//     if (costs) {
//       item.props.costs = costs;
//     }

//     const vitals = archetypesTroop.find((t) => t.Properties?.Vitals);
//     if (vitals) {
//       for (const vital of vitals.Properties.Vitals) {
//         item.props[vital.AttributeName.AttributeName] = vital.AttributeValue;
//       }
//     }

//     if (!database.find((d) => d.type === type)) {
//       database.push({
//         type,
//         items: [],
//       });
//     }
//     const items = database.find((d) => d.type === type)?.items!;
//     items.push(item);
//   } catch (e) {
//     console.warn("Error for " + novaFilename, e);
//   }
// }

// writeJSON(OUT_DIR + "/data/database.json", database);
// writeJSON(OUT_DIR + "/dicts/en.json", enDict);

async function saveIcon(assetPath: string) {
  const fileName = assetPath.split("/").at(-1)?.split(".")[0]!;

  const id = fileName;
  if (savedIcons.includes(id)) {
    return `${id}.webp`;
  }

  console.log("Saving icon", id, assetPath);
  await $`cwebp ${assetPath} -o ${OUT_DIR}/icons/${id}.webp -short`;

  savedIcons.push(id);
  return `${id}.webp`;
}

function addItemToDatabase(
  type: string,
  item: (typeof database)[number]["items"][number],
) {
  if (!database.find((d) => d.type === type)) {
    database.push({
      type,
      items: [],
    });
  }
  const items = database.find((d) => d.type === type)?.items!;
  items.push(item);
}
