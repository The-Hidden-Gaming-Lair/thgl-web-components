"use client";
import { cn } from "@/lib/utils";
import { FileText, Rocket } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppNav() {
  const pathname = usePathname();
  const baseUrl = pathname.split("/").slice(0, 3).join("/");
  return (
    <nav className="flex gap-4">
      <Link
        href={baseUrl}
        className={cn(
          "border-b-2 p-2 flex items-center gap-2 transition-all",
          pathname === baseUrl ? "border-brand" : "border-transparent"
        )}
      >
        <FileText className="text-zinc-500 h-5 w-5" /> Description
      </Link>
      <Link
        href={baseUrl + "/release-notes"}
        className={cn(
          "border-b-2 p-2 flex items-center gap-2 transition-all",
          pathname === baseUrl + "/release-notes"
            ? "border-brand"
            : "border-transparent"
        )}
      >
        <Rocket className="text-zinc-500 h-5 w-5" /> Release Notes
      </Link>
    </nav>
  );
}
