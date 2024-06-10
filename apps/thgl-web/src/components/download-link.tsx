"use client";
import { DownloadCloud } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { trackOutboundLinkClick } from "@repo/ui/header";
import { cn } from "@/lib/utils";

export default function DownloadLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      className={cn(
        "inline-flex items-center gap-1 font-bold text-sm",
        className,
      )}
      href={href}
      onClick={() => {
        trackOutboundLinkClick(href);
      }}
      target="_blank"
    >
      <DownloadCloud size={16} />
      {children}
    </Link>
  );
}
