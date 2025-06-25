import "@/styles/globals.css";
import "@repo/ui/styles/globals.css";

import { cn, fetchVersion } from "@repo/lib";
import { Inter as FontSans } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { Account, Brand, Header, PlausibleTracker } from "@repo/ui/header";
import type { Dict } from "@repo/ui/providers";
import { I18NProvider, TooltipProvider } from "@repo/ui/providers";
import { SettingsDialogContent, Toaster, Links } from "@repo/ui/controls";
import Link from "next/link";
import enDictGlobal from "@repo/ui/dicts/en.json" assert { type: "json" };
import { APP_CONFIG } from "@/config";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  themeColor: "black",
};

export const metadata: Metadata = {
  metadataBase: new URL(`https://${APP_CONFIG.domain}.th.gl`),
  title: `${APP_CONFIG.title} – The Hidden Gaming Lair`,
};
export const revalidate = 60;
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const version = await fetchVersion(APP_CONFIG.name);
  const enDictMerged = {
    ...enDictGlobal,
    ...version.data.enDict,
  } as Dict;

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
            activeApp={APP_CONFIG.title}
            settingsDialogContent={
              <SettingsDialogContent activeApp={APP_CONFIG.name} />
            }
          >
            <Link href="/">
              <Brand title={APP_CONFIG.domain} />
            </Link>
            <Links appConfig={APP_CONFIG} />
            <Account />
          </Header>
          <TooltipProvider>{children}</TooltipProvider>
        </I18NProvider>
        <PlausibleTracker
          apiHost="https://metrics.th.gl"
          domain={`${APP_CONFIG.domain}.th.gl`}
        />
        <Toaster />
      </body>
    </html>
  );
}
