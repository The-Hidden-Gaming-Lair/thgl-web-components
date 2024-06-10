import "@/styles/globals.css";
import "@repo/ui/styles/globals.css";

import type { Viewport } from "next";
import type { ReactNode } from "react";
import { Header, HeaderOffset, PlausibleTracker } from "@repo/ui/header";
import { I18NProvider } from "@repo/ui/providers";
import { Footer } from "@/components/footer";
import { Links } from "@/components/links";
import { Hero } from "@/components/hero";
import { cn } from "@/lib/utils";
import { exo2 } from "@/styles/fonts";
import enDictGlobal from "../global_dicts/en.json" assert { type: "json" };

export const metadata = {
  metadataBase: new URL("https://www.th.gl"),
  title: "The Hidden Gaming Lair - Enhance Your Gaming Experience",
  description:
    "Welcome to The Hidden Gaming Lair! Discover a variety of gaming apps and tools, including interactive maps, databases, and achievement trackers, designed to enhance your gaming experience. Explore our site and level up your gaming!",
  keywords: "gaming, apps, interactive maps, databases, achievement trackers",
  authors: [{ name: "DevLeon", url: "https://github.com/lmachens" }],
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className="scroll-smooth" lang="en">
      <head>
        <PlausibleTracker apiHost="https://metrics.th.gl" domain="th.gl" />
      </head>
      <body
        className={cn(
          exo2.className,
          "dark select-none text-slate-50 min-h-screen",
        )}
      >
        <I18NProvider dict={enDictGlobal}>
          <Header activeApp="THGL">
            <Links />
          </Header>

          <HeaderOffset full>
            <Hero />
            <main className="border-x border-[#1d1d1f] w-full max-w-7xl mx-auto grow">
              {children}
            </main>
            <Footer />
          </HeaderOffset>
        </I18NProvider>
      </body>
    </html>
  );
}
