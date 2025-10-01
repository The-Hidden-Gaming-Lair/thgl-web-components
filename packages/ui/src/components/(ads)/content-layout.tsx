import { cn } from "@repo/lib";
import { AdBlocker } from "./ad-blocker";
import { NitroScript } from "./nitro-script";

import {
  WideSkyscraper,
  WideSkyscraperFallback,
  WideSkyscraperLoading,
} from "./wide-skyscrapper";

import {
  LargeMobileBanner,
  LargeMobileBannerFallback,
  LargeMobileBannerLoading,
} from "./large-mobile-banner";

import {
  MobileBanner,
  MobileBannerFallback,
  MobileBannerLoading,
} from "./mobile-banner";

import { FloatingMobileBanner } from "./floating-mobile-banner";

interface ContentLayoutProps {
  id: string;
  header: React.ReactNode;
  content: React.ReactNode;
  more?: React.ReactNode;
  sidebar?: React.ReactNode;
}

export function ContentLayout({
  id,
  header,
  content,
  more,
  sidebar,
}: ContentLayoutProps) {
  return (
    <div className="flex grow p-2">
      {/* Left Ad */}
      <div>
        <NitroScript
          loading={<WideSkyscraperLoading />}
          fallback={
            <>
              <AdBlocker />
              <WideSkyscraperFallback />
            </>
          }
        >
          <WideSkyscraper
            id={`${id}-wide-skyscraper-1`}
            mediaQuery="(min-width: 1024px)"
          />
        </NitroScript>
      </div>

      {/* Main Content */}
      <div
        className={cn(
          "relative container p-4 text-center space-y-4 mb-48",
          sidebar && "xl:pl-[262px]",
        )}
      >
        {sidebar}
        {header}

        {/* Top Banner */}
        <NitroScript
          loading={<LargeMobileBannerLoading />}
          fallback={<LargeMobileBannerFallback />}
        >
          <LargeMobileBanner id={`${id}-large-mobile-banner`} />
        </NitroScript>

        {content}

        {/* Bottom Banner */}
        <NitroScript
          loading={<MobileBannerLoading />}
          fallback={<MobileBannerFallback />}
        >
          <MobileBanner id={`${id}-mobile-banner`} />
          <FloatingMobileBanner
            bannerId={`${id}:mobile-banner`}
            videoId={`${id}:mobile-video`}
          />
        </NitroScript>

        {more}
      </div>

      {/* Right Ad */}
      <div>
        <NitroScript
          loading={<WideSkyscraperLoading className="min-[860px]:block" />}
          fallback={<WideSkyscraperFallback className="min-[860px]:block" />}
        >
          <WideSkyscraper id={`${id}-wide-skyscraper-2`} />
        </NitroScript>
      </div>
    </div>
  );
}
