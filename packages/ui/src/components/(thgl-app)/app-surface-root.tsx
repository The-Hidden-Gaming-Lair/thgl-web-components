import type { CSSProperties, ReactNode } from "react";
import { AppConfig, cn } from "@repo/lib";
import {
  FooterSlotProvider,
  PlausibleTracker,
  StatusBanner,
} from "../(header)";
import { I18NProvider, TooltipProvider } from "../(providers)";
import {
  AudioAlertUnlocker,
  NewVersionWatcher,
  ThemeScript,
  Toaster,
} from "../(controls)";
import { AppContentShell } from "./app-content-shell";
import { NavigationProgress } from "../(apps)/navigation-progress";

/**
 * Root <html> for a game page rendered inside the companion app
 * (`app.th.gl/apps/<id>/<page>`, see @repo/lib app-surface.ts). Same providers
 * and page content as the website root layouts; the website header, footer and
 * companion-app tips are replaced by the app chrome. `--header-h` lets
 * HeaderOffset pad pages for the 32px app title bar instead of the 54px site
 * header, and `data-thgl-surface` re-tags the pages' ad slots as app inventory
 * (nitro-pay.ts).
 */
export function AppSurfaceRoot({
  appConfig,
  gameId,
  locale,
  dict,
  hasMap,
  hasGuides,
  children,
}: {
  appConfig: AppConfig;
  gameId: string;
  locale: string;
  dict: Record<string, string>;
  hasMap: boolean;
  hasGuides: boolean;
  children: ReactNode;
}) {
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      data-thgl-surface="app"
      style={{ "--header-h": "32px" } as CSSProperties}
    >
      <body
        className={cn(
          "font-sans dark min-h-dscreen bg-black text-white antialiased",
          "inter-font-sans",
        )}
      >
        <ThemeScript />
        <NavigationProgress />
        <I18NProvider dict={dict} locale={locale}>
          <TooltipProvider>
            <AppContentShell
              appConfig={appConfig}
              gameId={gameId}
              hasMap={hasMap}
              hasGuides={hasGuides}
            />
            <StatusBanner
              game={appConfig.name}
              surface="thgl-app"
              className="fixed top-[32px] inset-x-0 z-99989"
            />
            <FooterSlotProvider footer={null}>
              <main>{children}</main>
            </FooterSlotProvider>
          </TooltipProvider>
        </I18NProvider>
        <PlausibleTracker
          apiHost="https://a.th.gl"
          domain="thgl"
          app="thgl-app"
          platform="desktop"
          locale={locale}
        />
        <Toaster />
        <NewVersionWatcher />
        <AudioAlertUnlocker />
      </body>
    </html>
  );
}
