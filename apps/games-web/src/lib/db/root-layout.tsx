import "@/styles/globals.css";
import "@repo/ui/styles/globals.css";

import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Inter as FontSans } from "next/font/google";
import { AppConfig, cn, DEFAULT_LOCALE, fetchVersion } from "@repo/lib";
import {
  Header,
  Brand,
  Account,
  PlausibleTracker,
  StatusBanner,
} from "@repo/ui/header";
import {
  Links,
  LocaleSwitcher,
  LocaleSwitcherInline,
  AudioAlertUnlocker,
  NewVersionWatcher,
  Toaster,
} from "@repo/ui/controls";
import { I18NProvider, TooltipProvider } from "@repo/ui/providers";
import { SettingsDialogContent } from "@repo/ui/controls";
import { DidYouKnowCompanionApp } from "@repo/ui/tips";
import {
  getFullDictionary,
  getStaticDictionary,
  isValidLocale,
} from "@repo/ui/dicts";
import { DbSearch } from "@/lib/db/db-search";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

/**
 * Slice the client-shipped dict down to UI strings + the dict keys
 * referenced by internalLinks/externalLinks. Keeps RSC payloads small
 * for DB sites whose full dict can be ~1MB.
 */
function sliceClientDict(
  appConfig: AppConfig,
  fullDict: Record<string, string>,
  staticDict: Record<string, string>,
): Record<string, string> {
  const result = { ...staticDict };
  for (const link of appConfig.internalLinks ?? []) {
    if (fullDict[link.title]) result[link.title] = fullDict[link.title];
    if (link.description && fullDict[link.description])
      result[link.description] = fullDict[link.description];
  }
  for (const link of appConfig.externalLinks ?? []) {
    if (fullDict[link.title]) result[link.title] = fullDict[link.title];
  }
  for (const link of appConfig.promoLinks ?? []) {
    if (fullDict[link.title]) result[link.title] = fullDict[link.title];
  }
  return result;
}

/**
 * Root layout factory for apps that ship a DB (`appConfig.db` set).
 *
 * Two flavours are picked automatically from `version.data.filters`:
 *
 *   - **DB-only** (homm-olden-era): no filters → no Settings dialog,
 *     no /guides link, just the DbSearch input in the header.
 *   - **Hybrid** (blue-protocol-star-resonance): has filters →
 *     keeps the Settings dialog and /guides link from the standard
 *     map layout, and adds the DbSearch input alongside.
 *
 * Either flavour ships the full game dictionary (sliced for client) so
 * DB pages can resolve entity names without an additional fetch.
 */
export function createDbRootLayout(appConfig: AppConfig) {
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

    const [dict, staticDict, version] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      getStaticDictionary(appConfig.name, locale),
      fetchVersion(appConfig.name),
    ]);

    const clientDict = sliceClientDict(appConfig, dict, staticDict);
    const dbConfig = appConfig.db;
    // Hybrid mode: game ships filters (and therefore /guides + Settings).
    // DB-only sites like homm have an empty filter list → drop both.
    const hasFilters = version.data.filters.length > 0;

    return (
      <html lang={locale}>
        <body
          className={cn(
            "font-sans dark min-h-dscreen bg-black text-white antialiased",
            fontSans.variable,
          )}
        >
          <I18NProvider dict={clientDict} locale={locale}>
            <Header
              activeApp={appConfig.title}
              settingsTitle={dict["settings"]}
              settingsDialogContent={
                hasFilters ? (
                  <SettingsDialogContent
                    activeApp={appConfig.name}
                    filters={version.data.filters}
                  />
                ) : undefined
              }
            >
              <Link
                href={locale === DEFAULT_LOCALE ? "/" : `/${locale}`}
                // Accessible name must CONTAIN the visible Brand text (WCAG 2.5.3
                // Label in Name) — bare "Home" mismatched the "<DOMAIN>.TH.GL" logo
                // text. Mirror Brand's rendering; still names the link on mobile
                // where Brand is hidden.
                aria-label={`${appConfig.domain.replaceAll(" ", "").toUpperCase()}.TH.GL home`}
              >
                <Brand title={appConfig.domain} />
              </Link>

              <Links
                appConfig={appConfig}
                childrenDropdown={
                  appConfig.supportedLocales.length > 1 ? (
                    <Suspense>
                      <LocaleSwitcherInline
                        locales={appConfig.supportedLocales}
                        current={locale}
                      />
                    </Suspense>
                  ) : undefined
                }
                hasMap={
                  !appConfig.db?.hideInteractiveMap &&
                  Object.keys(version.data.tiles ?? {}).length > 0
                }
                hasGuides={hasFilters}
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

              <DbSearch
                locale={locale}
                placeholder={
                  dbConfig?.searchPlaceholder ??
                  dict["db.searchPlaceholder"] ??
                  "Search..."
                }
                typeLabels={dbConfig?.typeLabels}
                typeColors={dbConfig?.typeColors}
              />

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
          <AudioAlertUnlocker />
        </body>
      </html>
    );
  };
}
