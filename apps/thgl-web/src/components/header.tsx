import { Links } from "@repo/ui/controls";
import Image from "next/image";
import Link from "next/link";
import { GlobalSearch } from "./global-search";
import { appConfig } from "@/lib/config";
import { blogEntries } from "@/lib/blog-entries";
import { faqEntries } from "@/lib/faq-entries";

const blogSearchMeta = blogEntries.map((entry) => ({
  id: entry.id,
  headline: entry.headline,
}));

const faqSearchMeta = faqEntries.map((entry) => ({
  id: entry.id,
  headline: entry.headline,
}));

export function Header() {
  return (
    <header className="h-[54px] z-[9990] fixed left-0 right-0 top-0 border-b bg-gradient-to-b backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 flex items-center">
      <nav className="container flex gap-2 px-4 md:px-0 items-center">
        <Link
          className="flex text-lg md:text-2xl font-extrabold tracking-tight md:mr-6"
          href="/"
        >
          <Image
            src="/cave128.png"
            alt="Logo"
            width={32}
            height={32}
            className="mr-2"
          />
          TH.GL
        </Link>
        <Links appConfig={appConfig} hideReleaseNotes />
        <Link
          href="https://th.gl/discord"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-muted rounded-md transition"
          aria-label="Join the Discord Server"
        >
          <Image
            src="/Discord-Symbol-White.svg"
            alt="Discord"
            width={20}
            height={20}
            className="h-5 w-5 opacity-80"
          />
        </Link>
        <GlobalSearch blogMeta={blogSearchMeta} faqMeta={faqSearchMeta} />
      </nav>
    </header>
  );
}
