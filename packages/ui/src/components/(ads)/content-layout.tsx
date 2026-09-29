import { cn } from "@repo/lib";
import { AdBlocker } from "./ad-blocker";
import { ScriptLoader } from "./nitro-script";
import { getObfuscatedAdId, AD_TYPES } from "./obfuscated-ids";

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
  // Generate generic obfuscated IDs (shared across all subdomains for better dynamic flooring)
  const wideSkyscraper1Id = getObfuscatedAdId(AD_TYPES.WIDE_SKYSCRAPER_1);
  const wideSkyscraper2Id = getObfuscatedAdId(AD_TYPES.WIDE_SKYSCRAPER_2);
  const largeMobileBannerId = getObfuscatedAdId(AD_TYPES.LARGE_MOBILE_BANNER);
  const mobileBannerId = getObfuscatedAdId(AD_TYPES.MOBILE_BANNER);
  const mobileVideoId = getObfuscatedAdId(AD_TYPES.MOBILE_VIDEO);

  // Targeting for filtering in NitroPay reporting
  // Use 'platform' as primary discriminator to avoid bleed over between web/app
  const targeting = { platform: "web", game: id };
  return (
    <div className="flex grow p-2">
      {/* Left Ad */}
      <div>
        <ScriptLoader
          loading={<WideSkyscraperLoading />}
          fallback={
            <>
              <AdBlocker />
              <WideSkyscraperFallback />
            </>
          }
        >
          <WideSkyscraper
            id={wideSkyscraper1Id}
            targeting={targeting}
            mediaQuery="(min-width: 1024px)"
          />
        </ScriptLoader>
      </div>

      {/* Main Content */}
      {sidebar ? (
        // Fixed-height, internally-scrolling panes only at xl (sidebar visible);
        // below that the page scrolls normally — no nested scroll container
        // on phones.
        <div className="relative container grid grid-rows-[auto_1fr] xl:h-[calc(100dvh-54px-16px)] px-4 pt-2 text-left xl:overflow-hidden">
          {/* Row 1: breadcrumb */}
          {header}

          {/* Row 2: sidebar + content. Content comes FIRST in the DOM (crawlers
              and screen readers reach the entry before a long sidebar list);
              `xl:order-first` puts the sidebar back in the left column. */}
          <div className="grid xl:grid-cols-[250px_1fr] min-h-0">
            <div className="min-h-0 space-y-4 xl:overflow-y-auto xl:pl-5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ring/50 [&::-webkit-scrollbar-track]:bg-transparent">
              {/* Top Banner */}
              <ScriptLoader
                loading={<LargeMobileBannerLoading />}
                fallback={<LargeMobileBannerFallback />}
              >
                <LargeMobileBanner
                  id={largeMobileBannerId}
                  targeting={targeting}
                />
              </ScriptLoader>

              {content}

              {/* Bottom Banner */}
              <ScriptLoader
                loading={<MobileBannerLoading />}
                fallback={<MobileBannerFallback />}
              >
                <MobileBanner id={mobileBannerId} targeting={targeting} />
                <FloatingMobileBanner
                  bannerId={mobileBannerId}
                  videoId={mobileVideoId}
                  targeting={targeting}
                />
              </ScriptLoader>

              {more}
            </div>
            <aside className="sidebar-scroll hidden xl:block xl:order-first overflow-y-auto border-r border-zinc-800/60 pr-3 py-3 min-h-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ring/50 [&::-webkit-scrollbar-track]:bg-transparent">
              {sidebar}
            </aside>
          </div>
        </div>
      ) : (
        <div className="relative container p-4 text-center space-y-4 mb-48">
          {header}

          {/* Top Banner */}
          <ScriptLoader
            loading={<LargeMobileBannerLoading />}
            fallback={<LargeMobileBannerFallback />}
          >
            <LargeMobileBanner id={largeMobileBannerId} targeting={targeting} />
          </ScriptLoader>

          {content}

          {/* Bottom Banner */}
          <ScriptLoader
            loading={<MobileBannerLoading />}
            fallback={<MobileBannerFallback />}
          >
            <MobileBanner id={mobileBannerId} targeting={targeting} />
            <FloatingMobileBanner
              bannerId={mobileBannerId}
              videoId={mobileVideoId}
              targeting={targeting}
            />
          </ScriptLoader>

          {more}
        </div>
      )}

      {/* Right Ad */}
      <div>
        <ScriptLoader
          loading={<WideSkyscraperLoading className="min-[860px]:block" />}
          fallback={<WideSkyscraperFallback className="min-[860px]:block" />}
        >
          <WideSkyscraper id={wideSkyscraper2Id} targeting={targeting} />
        </ScriptLoader>
      </div>
    </div>
  );
}
