import { Links } from "@repo/ui/controls";
import { GameSwitcher } from "@repo/ui/header";
import Image from "next/image";
import Link from "next/link";
import { AccountLink } from "./account-link";
import { GlobalSearch } from "./global-search";
import { ThemeSelect } from "./theme-select";
import { appConfig } from "@/games/thgl-web/lib/config";
import { blogEntries } from "@/games/thgl-web/lib/blog-entries";
import { faqEntries } from "@/games/thgl-web/lib/faq-entries";

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
    <header className="h-[54px] z-99990 fixed left-0 right-0 top-0 border-b bg-linear-to-b backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 flex items-center">
      <nav className="container flex gap-2 px-4 md:px-0 items-center justify-between">
        {/* Same switcher as the game sites — www had no way into a game
            besides the /apps grid. */}
        <GameSwitcher activeApp={appConfig.title} />
        <Link
          className="hidden sm:flex shrink-0 text-lg md:text-2xl font-extrabold tracking-tight md:mr-6"
          href="/"
        >
          <Image
            src="/games/thgl-web/cave128.png"
            alt="Logo"
            width={32}
            height={32}
            className="mr-2"
          />
          TH.GL
        </Link>
        {/* Marketing site has no /maps or /guides routes — hide both nav
            links so they don't 404 (the Guides link defaults on). Its pages
            aren't "tools": the first four render as tabs, the rest under More. */}
        <Links
          appConfig={appConfig}
          hasMap={false}
          hasGuides={false}
          inlineLinks={4}
          routeFolder="www"
        />
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <GlobalSearch blogMeta={blogSearchMeta} faqMeta={faqSearchMeta} />
          <ThemeSelect />
          <AccountLink />
        </div>
      </nav>
    </header>
  );
}
