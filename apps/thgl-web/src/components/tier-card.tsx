import { Tier, perks } from "@/lib/tiers";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "./button";

export function TierCard({ tier }: { tier: Tier }) {
  return (
    <article
      className={cn(
        "rounded-lg border border-[#569287] bg-[#0b0a0e] overflow-hidden flex flex-col p-4 gap-4",
        tier.highlight && "scale-110",
      )}
    >
      <h3 className="text-xl font-semibold text-center">{tier.title}</h3>
      <p>
        <span className="block font-bold text-3xl text-brand">
          ${tier.price}
        </span>
        <span className="block text-slate-300 text-xs">per month</span>
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
      <Link
        href={`https://www.patreon.com/join/devleon/checkout?rid=${tier.id}`}
        passHref
        target="_blank"
      >
        <Button>Get Started</Button>
      </Link>
    </article>
  );
}
