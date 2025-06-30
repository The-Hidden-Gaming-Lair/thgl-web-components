import type { MetadataRoute } from "next";
import { AppConfig, fetchVersion } from "./config";

export function createSitemap(appConfig: AppConfig) {
  return async function (): Promise<MetadataRoute.Sitemap> {
    const baseUrl = `https://${appConfig.domain}.th.gl`;
    const version = await fetchVersion(appConfig.name);
    const mapNames = Object.keys(version.data.tiles);

    const maps = mapNames.map<MetadataRoute.Sitemap[number]>((mapName) => {
      const title = version.data.enDict[mapName];
      return {
        url: `${baseUrl}/maps/${encodeURIComponent(title)}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      };
    });

    const internalLinks =
      appConfig.internalLinks
        ?.map<MetadataRoute.Sitemap[number]>((link) => {
          return {
            url: `${baseUrl}${link.href}`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.8,
          };
        })
        .filter((a) => !maps.some((map) => map.url === a.url)) || [];

    let guides: MetadataRoute.Sitemap = [];
    if (appConfig.internalLinks?.some((link) => link.href === "/guides")) {
      guides = version.data.filters.flatMap<MetadataRoute.Sitemap[number]>(
        (filter) =>
          filter.values.flatMap((v) => {
            const url = `${baseUrl}/guides/${encodeURIComponent(version.data.enDict[v.id])}`;
            if (internalLinks.some((g) => g.url === url)) {
              return [];
            }

            return {
              url,
              lastModified: new Date(),
              changeFrequency: "weekly",
              priority: 0.5,
            };
          }),
      );
    }

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
      ...maps,
      ...internalLinks,
      ...guides,
    ];
  };
}
