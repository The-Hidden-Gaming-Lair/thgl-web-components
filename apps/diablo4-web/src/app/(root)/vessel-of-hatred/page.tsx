import { ContentLayout } from "@repo/ui/ads";
import { Button } from "@repo/ui/controls";
import { ExternalAnchor, HeaderOffset } from "@repo/ui/header";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  title: "Vessel of Hatred - Diablo IV - The Hidden Gaming Lair",
  description:
    "Prepare for the Vessel of Hatred expansion in Diablo IV with this interactive map and in-game app featuring real-time player position tracking. Find Helltide, Legion events, Altars of Lilith, and more!",
  keywords:
    "Vessel of Hatred, Diablo IV, Diablo 4, expansion, interactive map, real-time position tracking, Helltide, Legion, Altars of Lilith, in-game app, Diablo map, bosses, chests",
};

export default function VesselIOfHatred(): JSX.Element {
  return (
    <HeaderOffset full>
      <ContentLayout
        id="diablo4"
        header={
          <>
            <h2 className="text-2xl">
              Prepare for the First Diablo IV Expansion: Vessel of Hatred
            </h2>
            <p className="text-sm">
              The highly anticipated expansion for Diablo IV, Vessel of Hatred,
              is just around the corner, and players need to be well-prepared to
              conquer the new challenges. This interactive map, coupled with a
              powerful in-game app, will be your best companion as you explore
              new territories, battle dangerous bosses, and discover hidden
              secrets in Sanctuary.
            </p>
            <p className="text-lg leading-relaxed mt-4">
              Stay ahead with real-time position tracking and navigate your way
              through Diablo IV like never before!
            </p>
          </>
        }
        content={
          <>
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">
                Features of the Vessel of Hatred Expansion
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>New Regions to Explore</strong>: Vessel of Hatred will
                  introduce exciting new locations in the world of Sanctuary.
                </li>
                <li>
                  <strong>Challenging Bosses and Events</strong>: Face
                  formidable bosses, engage in Legion events, and survive
                  Helltide zones.
                </li>
                <li>
                  <strong>Uncover Secrets</strong>: Discover Altars of Lilith,
                  hidden chests, and the Wandering Death.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-primary mb-4">
                Interactive Map for Diablo IV Players
              </h3>
              <p className="text-lg leading-relaxed">
                This <strong>interactive map</strong> helps you find everything
                you need in Diablo IV, from rare treasures to event zones. The
                map covers:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>Helltide Zones</li>
                <li>Legion Events</li>
                <li>Wandering Death</li>
                <li>Altars of Lilith</li>
                <li>Chests</li>
                <li>Boss Locations</li>
                <li>And More!</li>
              </ul>
              <Button asChild className="mt-4">
                <Link href="/">Explore the Full Diablo IV Map</Link>
              </Button>
            </section>
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-primary mb-4">
                Real-Time Position Tracking with In-Game App
              </h3>
              <p className="text-lg leading-relaxed">
                To make your journey through Diablo IV smoother, this in-game
                app allows <strong>real-time player position tracking</strong>,
                so you’ll always know exactly where you are in the vast world of
                Sanctuary. Never miss an event or loot opportunity!
              </p>
              <Button asChild className="mt-4">
                <Link
                  href="https://www.overwolf.com/app/Leon_Machens-Diablo_4_Map"
                  target="_blank"
                >
                  Download the In-Game App
                </Link>
              </Button>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">
                Why Use This Map and App for Vessel of Hatred?
              </h2>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>Up-to-date Information</strong>: New features will be
                  added to this map with the Vessel of Hatred expansion.
                </li>
                <li>
                  <strong>Efficiency</strong>: Real-time tracking saves time and
                  ensures you find your targets quickly, whether it’s an altar
                  or an event zone.
                </li>
                <li>
                  <strong>Comprehensive</strong>: Everything from events to
                  hidden loot spots is covered.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">
                How to Get Started
              </h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  Access the Interactive Map: Open the{" "}
                  <Button asChild variant="link" className="p-0">
                    <Link href="/">full Diablo IV map</Link>
                  </Button>{" "}
                  to explore all key locations.
                </li>
                <li>
                  Download the In-Game App: Enhance your gameplay with this{" "}
                  <Button asChild variant="link" className="p-0">
                    <Link
                      href="https://www.overwolf.com/app/Leon_Machens-Diablo_4_Map"
                      target="_blank"
                    >
                      real-time position tracking app
                    </Link>
                  </Button>
                  , available for free.
                </li>
                <li>
                  Prepare for Battle: Equip yourself with the best tools, locate
                  treasures and bosses, and conquer new challenges in the
                  expansion.
                </li>
              </ol>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-primary mb-4">
                Stay Updated for the Latest News
              </h3>
              <p className="text-lg leading-relaxed">
                Get the latest news and join the discussions about this
                interactive map!
              </p>
              <Button asChild className="mt-4">
                <ExternalAnchor href="https://th.gl/discord">
                  Join the Discord Server
                </ExternalAnchor>
              </Button>
            </section>
          </>
        }
      />
    </HeaderOffset>
  );
}
