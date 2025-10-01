import { HeaderOffset } from "@repo/ui/header";
import { DataTable } from "@repo/ui/data";
import { type Metadata } from "next";
import { ContentLayout } from "@repo/ui/ads";
import { type Item, columns } from "./columns";

export const metadata: Metadata = {
  alternates: {
    canonical: "/deviant-locations",
  },
  title: "All Deviant Locations – The Hidden Gaming Lair",
  description:
    "A comprehensive list of deviant locations for Once Human. It includes information about the deviant's type and effects, which can help users strategize and utilize each deviant effectively.  Moreover, this guide also informs about the deviant's likes, which are essential in maximizing their happiness and productivity. This guide is regularly updated and verified to ensure accuracy and completeness.",
};

const allDeviantLocations: Item[] = [
  {
    deviantName: "Butterfly",
    location: "Campaign Intro",
    type: "Attacker",
    likes: "Green Light, Flowers",
  },
  {
    deviantName: "Festering Gel",
    location: "Monolith Of Greed / Shadowhunter",
    type: "Defensive",
    likes: "Red Light, 2watts power",
  },
  {
    deviantName: "Harveseed",
    location: "Gaia Cliff Monolith / Treant",
    type: "Shield Potion",
    likes: "Crops, Flowers, High Temps",
  },
  {
    deviantName: "Dream Catcher",
    location: "Mirage Monolith / Arachnism",
    type: "Web Potion",
    likes: "Blue Light, Music, Flowers",
  },
  {
    deviantName: "Canine Skull",
    location: "Monolith of Thirst / Rabizex",
    type: "Attacker",
    likes: "Red Light, Fridge 5 watts power",
  },
  {
    deviantName: "Nutcracker",
    location: "Mensdevoran",
    type: "Attacker",
    likes: "Green Light Toys, 5 watts power",
  },
  {
    deviantName: "Mr.Wish",
    location: "Silo Sigma Party Room",
    type: "Attacker",
    likes: "Red Light, Music, Toys, Flowers, 10 watts power",
  },
  {
    deviantName: "Chefosaurus (PVE Servers)",
    location: "Silo Phi: Bedroom",
    type: "Territory: Cooking Speed",
    likes: "Red Light, Toys, High Temps",
  },
  {
    deviantName: "Pyro Dino (PVP Servers)",
    location: "Silo Phi: Bedroom",
    type: "Combat: Fire Dmg",
    likes: "Green Light, Toys, High Temps",
  },
  {
    deviantName: "Polar Jelly (PVE Servers)",
    location: "Silo EX1-Siren Boss",
    type: "Combat: Frost Damage",
    likes: "Blue Light, Fridge, 3 watts Power",
  },
  {
    deviantName: "Atomic Lighter (PVP Servers)",
    location: "Silo EX1: Siren Boss",
    type: "Gadget: Dmg, Drops +",
    likes: "Red Light, Music, 3 watts Power",
  },
  {
    deviantName: "Enchanting Void (PVE Servers)",
    location: "Silo Theta: Statue Room",
    type: "Combat: Melee/Move Speed +",
    likes: "Red Light, Flowers, Fridge, 5 watts Power",
  },
  {
    deviantName: "Dr. Teddy (PVP Servers)",
    location: "Silo Theta: Statue Room",
    type: "Combat: Healing/Reviving",
    likes: "Green Light, Toys",
  },
  {
    deviantName: "Buzzy Bee (PVE Servers)",
    location: "Hidden Chests",
    type: "Territory: Farming",
    likes: "Music, Crops, Flowers",
  },
  {
    deviantName: "Pup Buddy (PVP Servers)",
    location: "Hidden Chests",
    type: "Gadget: Weight Reduction",
    likes: "Green Light, Music, Toys",
  },
  {
    deviantName: "The Digby Boy",
    location: "Mining Ore",
    type: "Territory: Mining",
    likes: "Music, Toys, High Temps, 5 watts Power",
  },
  {
    deviantName: "H37",
    location: "Campaign Quest/Silo Psi: Fridge Boss",
    type: "Territory: Salvaging",
    likes: "Music, Toys, 10 watts Power",
  },
  {
    deviantName: "Disco Ball",
    location: "In Wild: 5850, -5275 near gingerbread house",
    type: "Gadget: Sanity Potion",
    likes: "All 3 Light Colors",
  },
  {
    deviantName: "Gingerbread House",
    location: "In Wild: 5850, -5275",
    type: "Gadget: Disguise Food",
    likes: "Red Light, Crops, High Temps",
  },
  {
    deviantName: "Logging Beaver",
    location: "Near Docks or Fishing Events",
    type: "Territory: Logging",
    likes: "Music, Crops, High Temps, 3 watts Power",
  },
  {
    deviantName: "Wish Machine",
    location: "Main Questline",
    type: "Blueprint / Starcrom Spender",
    likes: "Furniture Item",
  },
  {
    deviantName: "Hug-In-a-Bowl",
    location: "Known Spawn: 5766, -6038s/ Train Tracks",
    type: "Sanity Food Item",
    likes: "Crops, Flowers",
  },
  {
    deviantName: "Space Turner",
    location: "Known Spawn: 6512, -5231 or near door puzzles",
    type: "Team Teleporter",
    likes: "Blue Light, Toys",
  },
  {
    deviantName: "Electric Eel",
    location: "Fishing",
    type: "Territory: Electricty Boost",
    likes: "Blue Light, High Temps, Music",
  },
  {
    deviantName: "Frog The Leaper",
    location: "Known Spawn: 6147, -3353",
    type: "Gadget: Jump Potion/ Bait",
    likes: "Toys, 2 watts Power",
  },
  {
    deviantName: "Rebecca",
    location: "LEA Facility: First 3 Bosses",
    type: "Territory: Plays Piano, Recovery +",
    likes: "Green Light, Toys, Flowers",
  },
  {
    deviantName: "Masonic Pyramid (PVP Servers)",
    location: "Completeting PvP territory wars",
    type: "Gadget: Invisible / Warning Potions",
    likes: "Blue Light, Music, High Temps, 10 watts Power",
  },
  {
    deviantName: "Grumpy Bulb",
    location: "Growing deviated onions",
    type: "Attacker",
    likes: "Crops, Flowers, High Temps",
  },
  {
    deviantName: "Fetch-A-Lot-Bunny",
    location: "Cut down a mother of life tree using an axe",
    type: "Territory: Harvesting Shrubs",
    likes: "Crops, Toys, Flowers",
  },
  {
    deviantName: "By the Wind (PVE Servers)",
    location: "Prime War Bosses",
    type: "Combat: Levitate/ Move Speed +",
    likes: "Blue Light, Red Light, Flowers, 5 watts Power",
  },
];

export default function DeviantLocations(): JSX.Element {
  return (
    <HeaderOffset full>
      <ContentLayout
        id="once-human"
        header={
          <>
            <h2 className="text-2xl">All Deviant Locations</h2>
            <p className="text-sm">
              The document provides a comprehensive list of deviant locations
              for the Once Human game. It includes information about the
              deviant's type and effects, which can help users strategize and
              utilize each deviant effectively. Moreover, this guide also
              informs about the deviant's likes, which are essential in
              maximizing their happiness and productivity. This guide is
              regularly updated and verified to ensure accuracy and
              completeness.
            </p>
          </>
        }
        content={<DataTable columns={columns} data={allDeviantLocations} />}
      />
    </HeaderOffset>
  );
}
