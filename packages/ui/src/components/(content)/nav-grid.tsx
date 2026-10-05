import { cn } from "@repo/lib";
import { NavCard, NavCardProps } from "./nav-card";

// Same widths as the home page's map and database grids, so one or two tools
// stay card-sized instead of stretching across the page.
export function NavGrid({
  cards,
  title,
}: {
  cards: NavCardProps[];
  title?: string;
}) {
  if (cards.length === 0) return null;
  return (
    <div className="space-y-2">
      {title && (
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
      )}
      <div
        className={cn(
          "grid gap-3",
          cards.length === 1
            ? "grid-cols-1 max-w-md mx-auto"
            : cards.length === 2
              ? "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto"
              : cards.length === 4
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {cards.map((card) => (
          <NavCard key={card.href ?? card.title} {...card} />
        ))}
      </div>
    </div>
  );
}
