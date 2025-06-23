import { Game } from "@repo/lib";
import { Badge, Card } from "@repo/ui/controls";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function GameCard({ game }: { game: Game }) {
  return (
    <Link
      href={`/apps/${game.id}`}
      className="block group"
      aria-label={`Explore tools for ${game.title}`}
    >
      <Card
        key={game.id}
        className="p-4 text-center space-y-2 hover:shadow-lg transition"
      >
        <Image
          src={game.logo}
          alt={`${game.title} logo`}
          width={64}
          height={64}
          className="mx-auto rounded"
        />
        <h2 className="text-lg font-semibold">{game.title}</h2>
        <div className="flex justify-center flex-wrap gap-1 text-xs">
          {game.companion && <Badge variant="default">Companion App</Badge>}
          {game.overwolf && <Badge variant="outline">Overwolf</Badge>}
          {game.web && <Badge variant="secondary">Website</Badge>}
        </div>
        <div className="flex justify-center items-center gap-1 text-sm text-brand font-medium group-hover:underline pt-1">
          Explore <ArrowRight className="h-4 w-4" />
        </div>
      </Card>
    </Link>
  );
}
