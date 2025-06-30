import { NavCard, NavCardProps } from "./nav-card";

export function NavGrid({ cards }: { cards: NavCardProps[] }) {
  const withBgImage = cards.filter((card) => card.bgImage);
  const withoutBgImage = cards.filter((card) => !card.bgImage);
  return (
    <>
      <div className="flex flex-wrap justify-center gap-4">
        {withBgImage.map((card, index) => (
          <NavCard key={index} {...card} />
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {withoutBgImage.map((card, index) => (
          <NavCard key={index} {...card} />
        ))}
      </div>
    </>
  );
}
