import "@/styles/globals.css";
import "@repo/ui/styles/globals.css";

import { cn } from "@repo/lib";
import { Inter as FontSans } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { PlausibleTracker } from "@repo/ui/header";
import type { Dict } from "@repo/ui/providers";
import { I18NProvider, TooltipProvider } from "@repo/ui/providers";
import { Toaster } from "@repo/ui/controls";
import enDictGlobal from "@repo/ui/dicts/en.json" assert { type: "json" };
import { getCurrentVersion } from "@/version";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  themeColor: "black",
};

export const metadata: Metadata = {
  metadataBase: new URL(`https://app.th.gl`),
  title: `App – The Hidden Gaming Lair`,
};
export const revalidate = 60;
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const version = await getCurrentVersion();

  const enDictMerged = {
    ...enDictGlobal,
  } as Dict;
  return (
    <html lang="en">
      <body
        className={cn(
          "font-sans dark h-dscreen bg-transparent text-white antialiased select-none overflow-hidden flex",
          fontSans.variable,
        )}
      >
        <I18NProvider dict={enDictMerged}>
          <TooltipProvider>{children}</TooltipProvider>
        </I18NProvider>
        <PlausibleTracker
          apiHost="https://metrics.th.gl"
          domain="app.th.gl"
          version={version.version}
        />
        <Toaster />
      </body>
    </html>
  );
}
