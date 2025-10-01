import { NavCard, NavCardProps } from "./nav-card";

export function NavGrid({ cards }: { cards: NavCardProps[] }) {
  const [withBgImage, withoutBgImage] = cards.reduce<
    [NavCardProps[], NavCardProps[]]
  >(
    (acc, card) => {
      card.bgImage ? acc[0].push(card) : acc[1].push(card);
      return acc;
    },
    [[], []],
  );

  const renderCards = (cards: NavCardProps[]) => (
    <div className="flex flex-wrap justify-center gap-4">
      {cards.map((card) => (
        <NavCard key={card.href ?? card.title} {...card} />
      ))}
    </div>
  );

  return (
    <>
      {renderCards(withBgImage)}
      {renderCards(withoutBgImage)}
    </>
  );
}
