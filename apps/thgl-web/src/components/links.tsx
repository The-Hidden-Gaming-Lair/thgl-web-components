"use client";
import { Heart, HeartHandshake, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import DiscordButton from "./discord-button";

export function Links() {
  const pathname = usePathname();

  return (
    <>
      <Link
        className="text-lg md:text-2xl font-extrabold tracking-tight"
        href="/"
      >
        TH.GL
      </Link>
      <Link
        className={cn(
          "text-gray-400 hover:text-brand transition-colors  duration-500 flex items-center gap-1",
          pathname === "/" && "text-brand"
        )}
        href="/"
      >
        <LayoutGrid className="w-5 h-5" />
        <span>
          <span aria-label="Gaming" className="hidden md:inline">
            Gaming{" "}
          </span>
          Apps
        </span>
      </Link>
      <Link
        className={cn(
          "text-gray-400 hover:text-brand transition-colors  duration-500 flex items-center gap-1",
          pathname.startsWith("/support-me") && "text-brand"
        )}
        href="/support-me"
      >
        <Heart className="w-5 h-5" />
        <span>
          Support
          <span aria-label=" Me" className="hidden md:inline">
            {" "}
            Me
          </span>
        </span>
      </Link>
      <Link
        className={cn(
          "text-gray-400 hover:text-brand transition-colors duration-500 flex items-center gap-1",
          pathname.startsWith("/partner-program") && "text-brand"
        )}
        href="/partner-program"
      >
        <HeartHandshake className="w-5 h-5" />
        <span aria-label="Partner">
          Partner
          <span aria-label=" Program" className="hidden md:inline">
            {" "}
            Program
          </span>
        </span>
      </Link>
      <DiscordButton>
        <span aria-label="Join the Discord" className="hidden md:block">
          Discord
        </span>
      </DiscordButton>
    </>
  );
}
