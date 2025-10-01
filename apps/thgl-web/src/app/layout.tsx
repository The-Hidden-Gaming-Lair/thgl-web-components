import "@/styles/globals.css";
import "@repo/ui/styles/globals.css";

import type { Viewport } from "next";
import type { ReactNode } from "react";
import { PlausibleTracker } from "@repo/ui/header";
import { I18NProvider } from "@repo/ui/providers";
import enDictGlobal from "@repo/ui/dicts/en.json" assert { type: "json" };
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { cn } from "@/lib/utils";
import { exo2 } from "@/styles/fonts";
import { ErrorBoundary } from "@repo/ui/controls";
import { Header } from "@/components/header";

export const metadata = {
  metadataBase: new URL("https://www.th.gl"),
  title: "The Hidden Gaming Lair – Game Tools, Maps & Overlays",
  description:
    "Explore interactive maps, overlays, and gaming tools for your favorite titles. Companion App, Overwolf tools, and web-based utilities — all in one place.",
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
          <Header />
          <div className="flex flex-col container px-0 pt-[54px] min-h-dvh">
            <ErrorBoundary>
              <Hero />
              <main className="border-x border-[#1d1d1f] grow md:px-10">
                {children}
              </main>
              <Footer />
            </ErrorBoundary>
          </div>
        </I18NProvider>
      </body>
    </html>
  );
}
