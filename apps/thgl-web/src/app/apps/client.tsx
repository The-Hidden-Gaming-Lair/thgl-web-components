"use client";
import { useState } from "react";
import { Input } from "@repo/ui/controls";
import { Subtitle } from "@/components/subtitle";
import { games } from "@repo/lib";
import { GameCard } from "@/components/game-card";

export function ClientAppsPage() {
  const [search, setSearch] = useState("");

  const filtered = games.filter((game) =>
    game.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <section className="px-4 pt-10 pb-20 max-w-5xl mx-auto space-y-10">
      <div className="text-center space-y-2">
        <Subtitle>Gaming Apps & Tools</Subtitle>
        <p className="text-muted-foreground">
          Explore overlays, maps, and tracking tools for supported games. Use
          the Companion App, Overwolf, or web-based tools — whatever fits your
          playstyle.
        </p>
      </div>

      <Input
        type="search"
        placeholder="Search games..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm mx-auto"
      />

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground mt-8">
          No games found. Try another keyword.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </section>
  );
}
