import { AdBlocker } from "./ad-blocker";
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
import { NitroScript } from "./nitro-script";
import {
  WideSkyscraper,
  WideSkyscraperFallback,
  WideSkyscraperLoading,
} from "./wide-skyscrapper";

export function ContentLayout({
  id,
  header,
  content,
}: {
  id: string;
  header: React.ReactNode;
  content: React.ReactNode;
}) {
  return (
    <div className="flex grow p-2">
      <div className="">
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
      <div className="container p-4 text-center space-y-4">
        {header}
        <NitroScript
          loading={<LargeMobileBannerLoading />}
          fallback={<LargeMobileBannerFallback />}
        >
          <LargeMobileBanner id={`${id}-large-mobile-banner`} />
        </NitroScript>
        {content}
        <NitroScript
          loading={<MobileBannerLoading />}
          fallback={<MobileBannerFallback />}
        >
          <MobileBanner id={`${id}-mobile-banner`} />
        </NitroScript>
      </div>
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
