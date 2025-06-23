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

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
      ...maps,
      ...internalLinks,
    ];
  };
}
