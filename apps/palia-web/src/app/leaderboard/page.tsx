import { ExternalAnchor, HeaderOffset } from "@repo/ui/header";
import { type Metadata } from "next";
import { ContentLayout } from "@repo/ui/ads";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import _enDict from "../../dicts/en.json" assert { type: "json" };

export const metadata: Metadata = {
  alternates: {
    canonical: "/leaderboard",
  },
  title: "Palia App Leaderboard – The Hidden Gaming Lair",
  description:
    "Check out the Palia App Leaderboard and see who has the highest rank and skill levels.",
};

const SKILL_ICONS = {
  BugCatching: "Icon_Skill_Bug_01.webp",
  // Combat: "Icon_Skill_Bug_01.webp",
  Fishing: "Icon_Skill_Fishing_01.webp",
  Foraging: "Icon_Skill_Forage_01.webp",
  Hunting: "Icon_Skill_Hunt_01.webp",
  Mining: "Icon_Skill_Mining_01.webp",
  // Alchemy:"Icon_Skill_Bug_01.webp",
  Cooking: "Icon_Skill_Cooking_01.webp",
  FurnitureMaking: "Icon_Skill_Furniture_01.webp",
  Gardening: "Icon_Skill_Gardening_01.webp",
  // AnimalHusbandry:"Icon_Skill_Bug_01.webp",
  // Blacksmithing:"Icon_Skill_Bug_01.webp",
  // Master:"Icon_Skill_Bug_01.webp",
};

export default async function Leaderboard() {
  const respone = await fetch(
    "https://palia-api.th.gl/nodes?type=players&limit=100",
    {
      next: { tags: ["leaderboard"] },
    },
  );
  const data = (await respone.json()) as Players;

  const players = data
    .map((player) => {
      return {
        id: player.id,
        name: player.name,
        level: player.level,
        skillLevels: player.skillLevels.filter(
          (skillLevel) => skillLevel.type in SKILL_ICONS,
        ),
        lastKnownPrimaryHousingPlotValue:
          player.lastKnownPrimaryHousingPlotValue,
      };
    })
    .sort((a, b) => b.level - a.level);
  return (
    <HeaderOffset full>
      <ContentLayout
        id="palia"
        header={
          <>
            <h2 className="text-2xl">Palia App Leaderboard</h2>
            <p className="text-sm">
              Check out the Palia App Leaderboard and see who has the highest
              rank and skill levels. Leaderboard. Discover where you rank in
              character level and skill proficiency. To join this leaderboard,
              ensure you have the{" "}
              <ExternalAnchor
                href="https://www.overwolf.com/app/Leon_Machens-Palia_Map"
                className="inline-flex gap-1 text-primary"
              >
                In-Game App
                <ExternalLink className="w-3 h-3" />
              </ExternalAnchor>{" "}
              installed. Dive into the world of Palia, track your progress, and
              compete with other players for the top spot!
            </p>
          </>
        }
        content={
          <table className="table-fixed mx-auto border-separate border-spacing-4">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Level</th>
                <th className="hidden sm:block">Skills</th>
                <th>Plot Level</th>
              </tr>
            </thead>
            <tbody>
              {players.slice(0, 100).map((player, index) => (
                <tr key={player.name}>
                  <td className="text-gray-400">{index + 1}</td>
                  <td className="truncate max-w-[180px]">{player.name}</td>
                  <td>{player.level}</td>
                  <td className="gap-1 flex-wrap hidden sm:flex">
                    {player.skillLevels.map((skillLevel) => (
                      <div key={skillLevel.type} className="relative w-12 h-12">
                        <Image
                          src={`/icons/${SKILL_ICONS[
                            skillLevel.type as keyof typeof SKILL_ICONS
                          ].toLowerCase()}`}
                          width={20}
                          height={20}
                          alt={skillLevel.type}
                          className="inline-block object-contain"
                        />
                        <span className="absolute bottom-0 left-0 right-0 w-8 mx-auto bg-gray-800 border border-gray-600 rounded px-0.5 text-xs">
                          {skillLevel.level}
                        </span>
                      </div>
                    ))}
                  </td>
                  <td>{player.lastKnownPrimaryHousingPlotValue ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      />
    </HeaderOffset>
  );
}

export interface VillagerGiftHistory {
  villagerCoreId: number;
  itemPersistId: number;
  lastGiftedMs: number;
  associatedPreferenceVersion: number;
}

export interface SkillLevels {
  type: string;
  level: number;
  xpGainedThisLevel: number;
}

export type Players = {
  id: string;
  name: string;
  level: number;
  giftHistory: VillagerGiftHistory[];
  skillLevels: SkillLevels[];
  mapName: string;
  position: [number, number, number];
  lastKnownPrimaryHousingPlotValue?: number;
  timestamp: number;
}[];
