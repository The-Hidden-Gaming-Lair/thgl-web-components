import { Game } from "@repo/lib";
import { Badge, Card } from "@repo/ui/controls";
import Image from "next/image";
import Link from "next/link";
import { GamePreviewImage } from "./game-preview-image";

export function GameCard({ game }: { game: Game }) {
  const previewImageUrl = game.web ? `${game.web}/opengraph-image.jpg` : null;

  return (
    <Link
      href={`/apps/${game.id}`}
      className="block group"
      aria-label={`Explore tools for ${game.title}`}
    >
      <Card className="overflow-hidden hover:shadow-lg transition">
        {/* Preview Image with Overlapping Metadata */}
        <div className="relative aspect-1200/700 w-full bg-muted overflow-hidden">
          {previewImageUrl ? (
            <GamePreviewImage
              previewUrl={previewImageUrl}
              logo={game.logo}
              title={game.title}
            />
          ) : (
            /* Fallback to logo-only when no preview */
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src={game.logo}
                unoptimized
                alt={`${game.title} logo`}
                width={80}
                height={80}
                className="rounded"
                sizes="80px"
              />
            </div>
          )}

          {/* Overlapping Metadata with Blur */}
          <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md p-4 space-y-2">
            {/* Title with Icon */}
            <div className="flex items-center gap-2">
              <Image
                src={game.logo}
                unoptimized
                alt={`${game.title} logo`}
                width={32}
                height={32}
                className="rounded shrink-0"
                sizes="32px"
              />
              <h2 className="text-lg font-semibold truncate">{game.title}</h2>
            </div>

            {/* Platform Badges */}
            <div className="flex flex-wrap gap-1 text-xs">
              {game.companion && (
                <Badge
                  variant="default"
                  className="hover:bg-primary pointer-events-none"
                >
                  Companion App
                </Badge>
              )}
              {game.overwolf && (
                <Badge
                  variant="outline"
                  className="border-primary/50 text-primary bg-primary/10 pointer-events-none"
                >
                  Overwolf
                </Badge>
              )}
              {game.web && (
                <Badge
                  variant="secondary"
                  className="hover:bg-secondary pointer-events-none"
                >
                  Website
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
