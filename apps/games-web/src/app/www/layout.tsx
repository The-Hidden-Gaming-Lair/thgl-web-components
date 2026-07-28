import "@/games/thgl-web/styles/globals.css";
import "@repo/ui/styles/globals.css";

import type { Viewport } from "next";
import type { ReactNode } from "react";
import { Account, PlausibleTracker, StatusBanner } from "@repo/ui/header";
import { I18NProvider } from "@repo/ui/providers";
import enDictGlobal from "@repo/ui/dicts/en.json" assert { type: "json" };
import { Footer } from "@/games/thgl-web/components/footer";
import { HeroBackground } from "@/games/thgl-web/components/hero-background";
import { cn } from "@/games/thgl-web/lib/utils";
import { exo2 } from "@/games/thgl-web/styles/fonts";
import { ErrorBoundary } from "@repo/ui/controls";
import { Header } from "@/games/thgl-web/components/header";

export const metadata = {
  metadataBase: new URL("https://www.th.gl"),
  title: "The Hidden Gaming Lair – Game Tools, Maps & Overlays",
  description:
    "Explore interactive maps, overlays, and gaming tools for your favorite titles. Companion App, Overwolf tools, and web-based utilities — all in one place.",
  keywords: "gaming, apps, interactive maps, databases, achievement trackers",
  authors: [{ name: "DevLeon", url: "https://github.com/lmachens" }],
  twitter: { card: "summary_large_image" },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className="scroll-smooth" lang="en">
      <head>
        <PlausibleTracker
          apiHost="https://a.th.gl"
          domain="thgl"
          app="thgl-web"
          platform="web"
          locale="en"
        />
      </head>
      <body className={cn(exo2.className, "dark text-slate-50 min-h-screen")}>
        <I18NProvider dict={enDictGlobal}>
          {/* Refreshes the persisted account store (perks + profile) so
              the header account icon reflects the real sign-in state. */}
          <Account />
          <Header />
          <div className="flex flex-col container px-0 pt-[54px] min-h-dvh">
            {/* Inside the pt-[54px] container so it sits below the fixed
                header instead of hiding behind it. */}
            <StatusBanner game={null} />
            <ErrorBoundary>
              <HeroBackground />
              <main className="grow md:px-10">{children}</main>
              <Footer />
            </ErrorBoundary>
          </div>
        </I18NProvider>
      </body>
    </html>
  );
}
