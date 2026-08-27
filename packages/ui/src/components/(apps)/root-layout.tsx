import { AppConfig, cn, DEFAULT_LOCALE, fetchVersion } from "@repo/lib";
import { Inter as FontSans } from "next/font/google";
import type { Metadata, Viewport } from "next";
import {
  Account,
  Brand,
  Header,
  PlausibleTracker,
  StatusBanner,
} from "../(header)";
import { I18NProvider, TooltipProvider } from "../(providers)";
import {
  SettingsDialogContent,
  Toaster,
  NewVersionWatcher,
  Links,
  LocaleSwitcher,
} from "../(controls)";
import Link from "next/link";
import {
  getFullDictionary,
  getStaticDictionary,
  isValidLocale,
} from "../../dicts";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DidYouKnowCompanionApp } from "../(tips)";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const rootLayoutViewport: Viewport = {
  themeColor: "black",
};

export function createRootLayoutMetadata(appConfig: AppConfig): Metadata {
  return {
    metadataBase: new URL(`https://${appConfig.domain}.th.gl`),
    title: `${appConfig.title} – The Hidden Gaming Lair`,
    authors: [{ name: "DevLeon", url: "https://github.com/lmachens" }],
    twitter: {
      card: "summary_large_image",
    },
  };
}

export function createRootLayout(appConfig: AppConfig) {
  return async function RootLayout({
    children,
    params,
  }: {
    children: React.ReactNode;
    params: Promise<{ locale?: string }>;
  }) {
    const { locale = DEFAULT_LOCALE } = await params;

    if (!isValidLocale(locale)) {
      notFound();
    }

    // Ship UI strings + filter group/value display NAMES to the client.
    // The full game dict (up to ~1MB) — which also carries long descriptions
    // — still isn't shipped globally; pages needing full game-id translation
    // (the map) wrap their content in a nested provider with it. But the
    // header lives here at the root, and components in it (the Settings dialog:
    // Active Alerts list, Per-Filter Icon Sizes) need to resolve filter names.
    // So augment the static UI dict with names only — a small, descriptions-
    // free slice — instead of the whole dict.
    const [staticDict, fullDict, version] = await Promise.all([
      getStaticDictionary(appConfig.name, locale),
      getFullDictionary(appConfig.name, locale),
      fetchVersion(appConfig.name),
    ]);

    const dict: Record<string, string> = { ...staticDict };
    // Copy a name key plus, if its value is an @-pointer, the pointer target
    // (translate() resolves "@xxx" via dict["@xxx"], which would otherwise be
    // missing from this slice and render as the raw pointer).
    const addName = (key: string) => {
      const value = fullDict[key];
      if (!value) return;
      dict[key] = value;
      if (value[0] === "@" && fullDict[value]) dict[value] = fullDict[value];
    };
    for (const group of version.data.filters) {
      addName(group.group);
      for (const value of group.values) addName(value.id);
    }

    return (
      <html lang={locale}>
        <body
          className={cn(
            "font-sans dark min-h-dscreen bg-black text-white antialiased",
            fontSans.variable,
          )}
        >
          <I18NProvider dict={dict} locale={locale}>
            <Header
              activeApp={appConfig.title}
              settingsDialogContent={
                <SettingsDialogContent
                  activeApp={appConfig.name}
                  filters={version.data.filters}
                  mapNames={Object.keys(version.data.tiles ?? {})}
                />
              }
              settingsTitle={dict["settings"]}
            >
              <Link
                href={locale === DEFAULT_LOCALE ? "/" : `/${locale}`}
                // Accessible name must CONTAIN the visible Brand text (WCAG 2.5.3
                // Label in Name) — bare "Home" mismatched the "<DOMAIN>.TH.GL" logo
                // text. Mirror Brand's rendering and append the intent; still names
                // the link on mobile where Brand is hidden.
                aria-label={`${appConfig.domain.replaceAll(" ", "").toUpperCase()}.TH.GL home`}
              >
                <Brand title={appConfig.domain} />
              </Link>

              <Links
                appConfig={appConfig}
                hasMap={
                  !appConfig.db?.hideInteractiveMap &&
                  Object.keys(version.data.tiles ?? {}).length > 0
                }
              >
                {appConfig.supportedLocales.length > 1 && (
                  <Suspense>
                    <LocaleSwitcher
                      locales={appConfig.supportedLocales}
                      current={locale}
                    />
                  </Suspense>
                )}
              </Links>

              <Account />
            </Header>

            <StatusBanner
              game={appConfig.name}
              surface="web"
              className="fixed top-[54px] inset-x-0 z-99989"
            />

            <TooltipProvider>
              <main>{children}</main>
            </TooltipProvider>

            <DidYouKnowCompanionApp appConfig={appConfig} />
          </I18NProvider>

          <PlausibleTracker
            apiHost="https://a.th.gl"
            domain="thgl"
            app={appConfig.name}
            platform="web"
            locale={locale}
          />
          <Toaster />
          <NewVersionWatcher />
        </body>
      </html>
    );
  };
}
