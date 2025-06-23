import { NavCard, NavCardProps } from "./nav-card";

export function NavGrid({ cards }: { cards: NavCardProps[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {cards.map((card, index) => (
        <NavCard key={index} {...card} />
      ))}
    </div>
  );
}
