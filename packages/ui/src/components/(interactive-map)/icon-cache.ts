/**
 * Shared image cache for marker icons.
 * Used by both markers.tsx and private-node.tsx to avoid reloading icons.
 */

const MAX_SOURCE_CACHE = 200;
const MAX_PROCESSED_CACHE = 500;

// Cache for source images (original icons before processing)
const sourceImageCache = new Map<string, HTMLImageElement>();

// Cache for processed images (icons with glow/color effects applied)
// Stores both the image and its dimensions since img.naturalWidth may not be reliable
interface ProcessedImageEntry {
  img: HTMLImageElement;
  width: number;
  height: number;
}
const processedImageCache = new Map<string, ProcessedImageEntry>();

// Evict oldest entries when cache exceeds max size (Map preserves insertion order)
function evictOldest<V>(cache: Map<string, V>, max: number): void {
  if (cache.size <= max) return;
  const toDelete = cache.size - max;
  const iter = cache.keys();
  for (let i = 0; i < toDelete; i++) {
    const key = iter.next().value;
    if (key !== undefined) cache.delete(key);
  }
}

export function getSourceImage(url: string): HTMLImageElement | undefined {
  const img = sourceImageCache.get(url);
  if (img?.complete && img.naturalWidth > 0) {
    return img;
  }
  return undefined;
}

export function setSourceImage(url: string, img: HTMLImageElement): void {
  sourceImageCache.set(url, img);
  evictOldest(sourceImageCache, MAX_SOURCE_CACHE);
}

// Pre-decoded pixels of a source image. Canvas drawImage() from an HTMLImageElement decodes
// it synchronously on the main thread (even after img.decode()); from an ImageBitmap it doesn't.
const decodedSources = new WeakMap<HTMLImageElement, ImageBitmap>();

/** Decode `img` off the main thread; resolves once getDrawableSource has it */
export async function decodeSourceImage(img: HTMLImageElement): Promise<void> {
  if (decodedSources.has(img)) return;
  try {
    // From a Blob, createImageBitmap decodes on a worker; from the element it decodes on the
    // main thread. The fetch is an HTTP-cache hit (same URL + CORS mode as the loaded image).
    const res = await fetch(img.src);
    if (!res.ok) return;
    decodedSources.set(img, await createImageBitmap(await res.blob()));
  } catch {
    // Not decodable as a bitmap: drawImage falls back to the element itself.
  }
}

/** What to drawImage() from: the pre-decoded bitmap when there is one, else the element */
export function getDrawableSource(
  img: HTMLImageElement,
): HTMLImageElement | ImageBitmap {
  return decodedSources.get(img) ?? img;
}

export function getProcessedImage(
  cacheKey: string,
): ProcessedImageEntry | undefined {
  const entry = processedImageCache.get(cacheKey);
  if (entry?.img?.complete) {
    return entry;
  }
  return undefined;
}

export function setProcessedImage(
  cacheKey: string,
  img: HTMLImageElement,
  width: number,
  height: number,
): void {
  processedImageCache.set(cacheKey, { img, width, height });
  evictOldest(processedImageCache, MAX_PROCESSED_CACHE);
}

// Helper to create a cache key for processed images
// Includes sprite rect coordinates since different icons on the same sprite sheet need different cache entries
export function createProcessedImageKey(
  url: string,
  color: string,
  rect?: { x: number; y: number; width: number; height: number } | null,
): string {
  const rectKey = rect
    ? `_${rect.x}_${rect.y}_${rect.width}_${rect.height}`
    : "";
  return `__processed_${url}_${color}${rectKey}__`;
}
