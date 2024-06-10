import "@/styles/globals.css";
import "@repo/ui/styles/globals.css";

import { cn } from "@repo/lib";
import { Inter as FontSans } from "next/font/google";
import type { Viewport } from "next";
import Link from "next/link";
import { Brand, Header, HeaderOffset } from "@repo/ui/header";
import {
  type Dict,
  I18NProvider,
  TooltipProvider,
  DatabaseProvider,
} from "@repo/ui/providers";
import { DatabaseSidebar } from "@/components/database-sidebar";
import enDictGlobal from "../global_dicts/en.json" assert { type: "json" };
import enDict from "../dicts/en.json" assert { type: "json" };
import database from "../data/database.json" assert { type: "json" };

const enDictMerged = { ...enDictGlobal, ...enDict } as unknown as Dict;

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  themeColor: "black",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const menu = database.map((item) => {
    return {
      category: {
        key: item.type,
        value: (
          <Link href={`/${item.type}`}>
            {enDictMerged[item.type] ?? item.type}
          </Link>
        ),
      },
      items: item.items.map((subitem) => ({
        key: subitem.id,
        value: (
          <Link href={`/${item.type}/${subitem.id}`}>
            {enDictMerged[subitem.id]}
          </Link>
        ),
      })),
    };
  });

  return (
    <html lang="en">
      <body
        className={cn(
          "font-sans dark min-h-dscreen bg-black text-white antialiased select-none",
          fontSans.variable,
        )}
      >
        <I18NProvider dict={enDictMerged}>
          <DatabaseProvider database={database}>
            <Header activeApp="Zero Space">
              <Link href="/">
                <Brand title="ZeroSpace" />
              </Link>
            </Header>
            <TooltipProvider>
              <HeaderOffset full>
                {/* <DatabaseSidebar menu={menu} /> */}
                <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
                  {children}
                </main>
              </HeaderOffset>
            </TooltipProvider>
          </DatabaseProvider>
        </I18NProvider>
      </body>
    </html>
  );
}
