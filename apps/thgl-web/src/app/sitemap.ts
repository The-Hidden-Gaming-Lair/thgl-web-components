import { apps } from "@/lib/apps";
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const appRoutes: MetadataRoute.Sitemap = apps.flatMap((app) => {
    return [
      {
        url: `https://www.th.gl/apps/${encodeURIComponent(app.title)}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 1,
      },
      {
        url: `https://www.th.gl/apps/${encodeURIComponent(
          app.title,
        )}/release-notes`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      },
    ];
  });
  return [
    {
      url: "https://www.th.gl",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    ...appRoutes,
    {
      url: "https://www.th.gl/support-me",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.th.gl/support-me/account",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.th.gl/partner-program",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
