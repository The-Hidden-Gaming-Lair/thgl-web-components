"use client";
import Image from "next/image";
import { useEffect, useState, type JSX } from "react";
import { type Game, games } from "@repo/lib";

export function HeroBackground(): JSX.Element {
  // Calculate how many icons we need to fill 3 rows across the screen
  const calculateIconsNeeded = () => {
    const screenWidth =
      typeof window !== "undefined" ? window.innerWidth : 1920;
    // Estimate ~80px per icon + gap
    const iconsPerRow = Math.ceil(screenWidth / 100);
    const totalNeeded = iconsPerRow * 3; // 3 rows

    // Duplicate games array to fill the space
    const duplicatedGames = [];
    while (duplicatedGames.length < totalNeeded) {
      duplicatedGames.push(...games);
    }
    return duplicatedGames.slice(0, totalNeeded);
  };

  const [displayGames, setDisplayGames] = useState<Game[]>([]);

  useEffect(() => {
    setDisplayGames(calculateIconsNeeded());
    const handleResize = () => {
      setDisplayGames(calculateIconsNeeded());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 -z-10 h-[33vh] overflow-hidden mt-[54px]">
      {/* Grid Pattern Background */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Game Logos Grid */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="grid gap-6 p-6 h-full"
          style={{
            gridTemplateRows: "repeat(3, 1fr)",
            gridAutoFlow: "column",
            gridAutoColumns: "minmax(80px, 1fr)",
          }}
        >
          {displayGames.map((game, idx) => (
            <div
              key={`${game.id}-${idx}`}
              className="relative aspect-square opacity-[0.05] grayscale blur-[1px]"
            >
              <Image
                src={game.logo}
                unoptimized
                alt=""
                fill
                className="object-contain"
                sizes="80px"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, hsl(var(--background)) 100%)",
        }}
      />
    </div>
  );
}
