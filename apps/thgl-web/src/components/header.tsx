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
        <Link
          href="https://github.com/The-Hidden-Gaming-Lair"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-muted rounded-md transition"
          aria-label="View on GitHub"
        >
          <svg
            viewBox="0 0 16 16"
            width="20"
            height="20"
            className="h-5 w-5 opacity-80 fill-current"
            aria-hidden="true"
          >
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
          </svg>
        </Link>
        <GlobalSearch blogMeta={blogSearchMeta} faqMeta={faqSearchMeta} />
      </nav>
    </header>
  );
}
