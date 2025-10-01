"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  EmblaAutoplay,
} from "@repo/ui/controls";
import { Partner } from "./partners";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Youtube, Twitch, Globe } from "lucide-react";

export function PartnerCarousel({ partners }: { partners: Partner[] }) {
  const plugin = useRef(
    EmblaAutoplay({ delay: 3000, stopOnInteraction: true }),
  );
  return (
    <Carousel
      plugins={[plugin.current]}
      opts={{ align: "start", loop: true }}
      className="w-full max-w-md mx-auto"
    >
      <CarouselContent>
        {partners.map((partner, index) => (
          <CarouselItem
            key={index}
            // className="p-4 text-center space-y-3 md:basis-1/2 lg:basis-1/3"
            className="p-4 text-center space-y-3"
          >
            <div className="relative w-20 h-20 mx-auto">
              <Image
                src={partner.avatar}
                alt={partner.name}
                fill
                className="rounded-full object-cover border"
              />
            </div>
            <h3 className="text-lg font-semibold">{partner.name}</h3>
            {partner.bio && (
              <p className="text-sm text-muted-foreground">{partner.bio}</p>
            )}
            <div className="flex justify-center flex-wrap gap-2">
              {partner.links.map((link, i) => (
                <Link
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm underline text-brand"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
