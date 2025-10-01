import Link from "next/link";
import { type Tier, perks } from "@/lib/tiers";
import { cn } from "@/lib/utils";
import { Button } from "@repo/ui/controls";

export function TierCard({ tier }: { tier: Tier }) {
  return (
    <article
      className={cn(
        "rounded-lg border  bg-[#0b0a0e] overflow-hidden flex flex-col p-4 gap-4",
        tier.highlight && "scale-110",
      )}
    >
      <h3 className="text-xl font-semibold text-center">{tier.title}</h3>
      <p>
        <span className={cn("block font-bold text-3xl text-brand")}>
          {tier.gift ? (
            <>
              <span className="line-through text-slate-500">${tier.price}</span>
              <span> $0</span>
            </>
          ) : (
            <>${tier.price}</>
          )}
        </span>
        <span className="block text-slate-300 text-xs">
          {tier.gift ? (
            <>in the first {tier.gift.months.toString()} months</>
          ) : (
            "per month"
          )}
        </span>
      </p>
      <ul className="grow space-y-2">
        {perks.map((perk) => (
          <li
            key={perk.title}
            className={cn(tier.perks.includes(perk.id) ? "" : "text-slate-500")}
          >
            {tier.perks.includes(perk.id) ? "✔" : "✖"} {perk.title}
          </li>
        ))}
      </ul>
      <Button variant="secondary" asChild>
        <Link
          href={
            tier.gift
              ? tier.gift.url
              : `https://www.patreon.com/join/devleon/checkout?rid=${tier.id}`
          }
          target="_blank"
        >
          {tier.gift ? "Join for free" : "Get Started"}
        </Link>
      </Button>
    </article>
  );
}
