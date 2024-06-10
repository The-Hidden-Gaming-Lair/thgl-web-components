import "@/styles/globals.css";
import "@repo/ui/styles/globals.css";

import { cn } from "@repo/lib";
import { Inter as FontSans } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { Account, Brand, Header, PlausibleTracker } from "@repo/ui/header";
import type { Dict } from "@repo/ui/providers";
import { I18NProvider, TooltipProvider } from "@repo/ui/providers";
import { SettingsDialogContent, Toaster } from "@repo/ui/controls";
import Link from "next/link";
import enDictGlobal from "../global_dicts/en.json" assert { type: "json" };
import { Links } from "../components/links";

const enDictMerged = enDictGlobal as unknown as Dict;

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  themeColor: "black",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://maps.th.gl"),
  title: "Interactive Maps – The Hidden Gaming Lair",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body
        className={cn(
          "font-sans dark min-h-dscreen bg-black text-white antialiased select-none",
          fontSans.variable,
        )}
      >
        <I18NProvider dict={enDictMerged}>
          <Header
            activeApp="Maps"
            settingsDialogContent={<SettingsDialogContent activeApp="Maps" />}
          >
            <Link href="/">
              <Brand title="Maps" />
            </Link>
            <Links />
            <Account appId="ebafpjfhleenmkcmdhlbdchpdalblhiellgfmmbb" />
          </Header>
          <TooltipProvider>{children}</TooltipProvider>
        </I18NProvider>
        <PlausibleTracker apiHost="https://metrics.th.gl" domain="maps.th.gl" />
        <Toaster />
      </body>
    </html>
  );
}
