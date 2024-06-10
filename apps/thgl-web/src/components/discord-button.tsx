import { cn } from "@/lib/utils";
import Link from "next/link";
import { ReactNode } from "react";
import DiscordIcon from "./discord-icon";

export default function DiscordButton({
  href = "https://th.gl/discord",
  children,
  className,
}: {
  href?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "ml-auto flex w-fit items-center gap-1 bg-discord/70 border border-white/10 rounded-md px-2 py-1 hover:bg-discord hover:border-white/15 transition-colors duration-500",
        className,
      )}
    >
      <DiscordIcon className="w-5 h-5" />
      {children}
    </Link>
  );
}
