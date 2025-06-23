"use client";
import { cn } from "@repo/lib";
import { Button } from "@repo/ui/controls";
import { trackOutboundLinkClick } from "@repo/ui/header";
import { Check } from "lucide-react";
import Link from "next/link";

export default function ServerPackage({
  pkg,
}: {
  pkg: {
    id: string;
    title: string;
    href: string;
    slots: number;
    price: string;
    features: string[];
    cta: string;
  };
}) {
  return (
    <article
      className={cn(
        "rounded-lg border bg-[#0b0a0e] overflow-hidden flex flex-col p-4 gap-4 ",
      )}
    >
      <h3 className="text-xl font-semibold text-center">{pkg.title}</h3>
      <p className="text-primary text-3xl mb-2 text-center font-bold">
        {pkg.slots} Slots
      </p>
      <ul className="space-y-1">
        {pkg.features.map((feature, i) => (
          <li key={i} className="flex items-center text-sm">
            <Check className="h-4 w-4 mr-2 text-green-500" />
            {feature}
          </li>
        ))}
      </ul>
      <p className="text-center">
        <span className={cn("block font-bold text-2xl text-brand")}>
          {pkg.price}
        </span>
        <span className="block text-slate-300 text-xs">per month</span>
      </p>

      <Button variant="secondary" asChild>
        <Link
          href={pkg.href}
          target="_blank"
          onClick={() => trackOutboundLinkClick(pkg.href)}
        >
          {pkg.cta}
        </Link>
      </Button>
    </article>
  );
}
