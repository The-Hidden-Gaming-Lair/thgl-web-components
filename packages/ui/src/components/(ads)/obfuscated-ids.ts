/**
 * Obfuscated ID Generation for Ad Containers
 *
 * Defeats easylist rules that target ad containers by ID patterns like:
 * - div[id^="dune-awakening:"]
 * - div[id^="dune-awakening-wide-skyscraper-"]
 * - div#dune-awakening-mobile-banner
 *
 * Strategy:
 * 1. Use hash-based IDs instead of readable ad type names
 * 2. Remove predictable separators (: - _)
 * 3. Use generic IDs shared across all subdomains (better for NitroPay dynamic flooring)
 * 4. Keep deterministic per ad type (needed for consistent floor pricing)
 */

// Simple hash function to generate consistent IDs
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate obfuscated ad container ID
 *
 * Generic IDs shared across all subdomains for better dynamic flooring.
 * NitroPay can accumulate historical data across all games for better pricing.
 *
 * Before: "video"
 * After:  "c1a2b3c"
 *
 * Before: "wide-skyscraper-1"
 * After:  "d4e5f6g"
 */
export function getObfuscatedAdId(adType: string): string {
  // Hash only the ad type for generic IDs
  const hash = simpleHash(adType);

  // Add prefix to ensure valid HTML ID (must start with letter)
  // Use generic prefix that doesn't hint at purpose
  return `c${hash}`;
}

/**
 * Common ad type identifiers
 */
export const AD_TYPES = {
  VIDEO: "video",
  FLOATING_BANNER: "floating-banner",
  MOBILE_BANNER: "mobile-banner",
  // In-content bottom banner of ContentLayout. Must differ from MOBILE_BANNER:
  // that id belongs to the sticky FloatingMobileBanner rendered on the same page.
  MOBILE_BANNER_INLINE: "mobile-banner-inline",
  MOBILE_VIDEO: "mobile-video",
  WIDE_SKYSCRAPER_1: "wide-skyscraper-1",
  WIDE_SKYSCRAPER_2: "wide-skyscraper-2",
  LARGE_MOBILE_BANNER: "large-mobile-banner",
} as const;
