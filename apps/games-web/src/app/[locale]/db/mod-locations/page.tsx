import { HeaderOffset, PageTitle } from "@repo/ui/header";
import { DataTable } from "@repo/ui/data";
import { type Metadata } from "next";
import { ContentLayout } from "@repo/ui/ads";
import { JSONLDScript } from "@repo/ui/apps";
import Link from "next/link";
import { requireApp } from "@/lib/get-app-config";
import { type Item, columns } from "./columns";

import type { JSX } from "react";

const allModLocations: Item[] = [
  {
    modList: [
      "Elemental Amplifier",
      "Reload Rampage",
      "Crit Amplifier",
      "Deadshot",
      "Bullet Siphon",
      "Fateful Strike",
      "Lifeforce Boost",
      "Three Strikes",
      "Crit DMG Boost",
      "Weakspot DMG Boost",
      "Melee Momentum",
    ],
    itemTypes: ["Bottom", "Gloves"],
    dropLocation: "Silo Alpha",
    enemyType: "Rosetta",
    mapRegion: "Chalk Peak, Northwest",
  },
  {
    modList: [
      "Thunderclap",
      "Secluded Strike",
      "Targeted Strike",
      "Explosive Shrapnel",
      "Boomerang Bullet",
      "Slow and Steady",
      "Shooting Blitz",
      "Cryo Blast",
      "Rush Hour",
      "Reckless Bomber",
      "Ruthless Reaper",
      "Blaze Amplifier",
    ],
    itemTypes: ["Mask", "Shoes"],
    dropLocation: "Silo EX1",
    enemyType: "Deviants",
    mapRegion: "Chalk Peak, Southwest",
  },
  {
    modList: [
      "Weakspot DMG Boost",
      "Crit Amplifier",
      "Lifeforce Boost",
      "Secluded Strike",
      "Slow and Steady",
      "Crit DMG Boost",
      "Covered Advance",
      "Melee Amplifier",
      "Elemental Overload",
      "Rush Hour",
      "Ruthless Reaper",
      "Ferocious Charge",
    ],
    itemTypes: ["Gloves", "Shoes"],
    dropLocation: "Silo Sigma",
    enemyType: "Rosetta",
    mapRegion: "Broken Delta, North",
  },
  {
    modList: [
      "Rejuvenating",
      "Precise Strike",
      "Healing Fortification",
      "Quick Comeback",
      "Head-on Conflict",
      "Deviation Expert",
      "Mag Expansion",
      "Critical Rescue",
      "First-Move Advantage",
      "Work Of Proficiency",
      "Enduring Shield",
    ],
    itemTypes: ["Chest. Helmet"],
    dropLocation: "Silo Theta",
    enemyType: "Deviants",
    mapRegion: "Lone Wolf Wastes, North",
  },
  {
    modList: [
      "Elemental Amplifier",
      "Cryo Blast",
      "Reload Rampage",
      "Reckless Bomber",
      "Blaze Amplifier",
      "Shooting Blitz",
      "Deadshot",
      "Explosive Shrapnel",
      "Melee Momentum",
    ],
    itemTypes: ["Bottom", "Mask"],
    dropLocation: "Silo PSI",
    enemyType: "Rosetta",
    mapRegion: "Lone Wolf Wastes, Southeast",
  },
  {
    modList: [
      "Rejuvenating",
      "Precise Strike",
      "Healing Fortification",
      "Quick Comeback",
      "Head-on Conflict",
      "Deviation Expert",
      "Fateful Strike",
      "Mag Expansion",
      "Critical Rescue",
      "First-Move Advantage",
      "Work Of Proficiency",
      "Enduring Shield",
    ],
    itemTypes: ["Helmet", "Chest"],
    dropLocation: "Silo Phi",
    enemyType: "Deviants",
    mapRegion: "Iron River, Northwest",
  },
  {
    modList: [
      "Flame Resonance",
      "Blaze Blessing",
      "Frostwave",
      "Frosty Blessing",
      "Vortex Overcharge",
      "Vortex Multiplier",
      "Embers",
      "Burning Wrath",
    ],
    itemTypes: ["Burn", "Frost"],
    dropLocation: "Monolith Of Greed",
    enemyType: "Great One / Boss",
    mapRegion: "Dayton Wetlands, Northeast",
  },
  {
    modList: [
      "Long-Range Laceration",
      "Shrapnel Smash",
      "Shrapnel Carnage",
      "Shield Breaker",
      "Super Bullet",
      "Not Throw Away Your Shot",
      "Bounce Rampage",
      "Precision Bounce",
    ],
    itemTypes: ["Shrapnel", "Bounce"],
    dropLocation: "Monolith Of Thirst",
    enemyType: "Great One / Boss",
    mapRegion: "Chalk Peak, Central",
  },
  {
    modList: [
      "Pinpoint Strike",
      "Decisive Blow",
      "Surge Amplifier",
      "Shock Diffusion",
      "Eruptive Bomber",
      "Super Charged",
      "Static Shock",
      "Shock Rampage",
    ],
    itemTypes: ["Power Surge", "Unstable Bomber"],
    dropLocation: "Gaia Cliff Monolith",
    enemyType: "Great One / Boss",
    mapRegion: "Broken Delta. Central-West",
  },
  {
    modList: [
      "Fast Refurbish",
      "Precision Rush",
      "Lasting Fortification",
      "Double Gunner",
      "Hunter Perk",
      "Targeted Takedown",
      "Vulnerability Amplifier",
      "Fatal Flaw",
    ],
    itemTypes: ["Fast Gunner", "Bullseye"],
    dropLocation: "Mirage Monolith",
    enemyType: "Great One / Boss",
    mapRegion: "Iron River, Northeast",
  },
];

// Search-intent title ("all N mod locations") with the game name, derived
// from the table itself so the count never goes stale.
const modCount = new Set(allModLocations.flatMap((l) => l.modList)).size;
const sourceCount = allModLocations.length;
const metaTitle = `All ${modCount} Once Human Mod Locations – ${sourceCount} Drop Sources`;
const metaDescription = `Where to farm every Once Human mod: ${modCount} mods across ${sourceCount} drop sources (silos and monoliths) with gear slot, enemy type and map region for each.`;

export const metadata: Metadata = {
  alternates: {
    canonical: "/db/mod-locations",
  },
  title: metaTitle,
  description: metaDescription,
  openGraph: {
    title: metaTitle,
    description: metaDescription,
    url: "/db/mod-locations",
  },
};

export default async function ModLocations(): Promise<JSX.Element> {
  await requireApp("once-human");
  return (
    <>
      <JSONLDScript
        json={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "All Mod Locations – The Hidden Gaming Lair",
          description:
            "A comprehensive list of mod locations for Once Human. It details the mod list, item types, drop locations, enemy types, and map regions.",
          author: {
            "@type": "Organization",
            name: "The Hidden Gaming Lair",
            url: "https://www.th.gl",
          },
          publisher: {
            "@type": "Organization",
            name: "The Hidden Gaming Lair",
            url: "https://www.th.gl",
          },
          mainEntityOfPage: "https://oncehuman.th.gl/db/mod-locations",
        }}
      />
      <JSONLDScript
        json={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://oncehuman.th.gl/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "All Mod Locations",
              item: "https://oncehuman.th.gl/db/mod-locations",
            },
          ],
        }}
      />
      <HeaderOffset full>
        <PageTitle title="All Mod Locations" />
        <nav
          aria-label="Breadcrumb"
          className="text-xs text-muted-foreground px-4 py-2"
        >
          <ol className="flex items-center gap-1">
            <li>
              <Link
                href="/"
                className="hover:text-foreground transition-colors"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">All Mod Locations</li>
          </ol>
        </nav>
        <ContentLayout
          id="once-human"
          header={
            <>
              <h2 className="text-2xl">All Mod Locations</h2>
              <p className="text-sm">
                The document provides a comprehensive list of mod locations for
                the Once Human game. It details the mod list, item types, drop
                locations, enemy types, and map regions. Some notable mods
                include Elemental Amplifier, Thunderclap, Weakspot DMG Boost,
                Rejuvenating, and Flame Resonance, each found in different
                locations and gatherable by orbs in the silos.
                <br />
                This page will update and have accurate information during CBT3
                and on the games official launch.
              </p>
            </>
          }
          content={<DataTable columns={columns} data={allModLocations} />}
        />
      </HeaderOffset>
    </>
  );
}
