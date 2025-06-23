import { blogEntries } from "@/lib/blog-entries";
import { faqEntries } from "@/lib/faq-entries";
import { games } from "@repo/lib";
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const appRoutes: MetadataRoute.Sitemap = games.map((game) => ({
    url: `https://www.th.gl/apps/${encodeURIComponent(game.id)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 1,
  }));

  const faqRoutes: MetadataRoute.Sitemap = faqEntries.map((entry) => ({
    url: `https://www.th.gl/faq/${encodeURIComponent(entry.id)}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const blogRoutes: MetadataRoute.Sitemap = blogEntries.map((entry) => ({
    url: `https://www.th.gl/blog/${encodeURIComponent(entry.id)}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  return [
    {
      url: "https://www.th.gl",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://www.th.gl/apps",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://www.th.gl/companion-app",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://www.th.gl/support-me",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.th.gl/support-me/account",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://www.th.gl/partner-program",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://www.th.gl/advertise",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://www.th.gl/privacy-policy",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: "https://www.th.gl/legal-notice",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: "https://www.th.gl/faq",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: "https://www.th.gl/blog",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...appRoutes,
    ...faqRoutes,
    ...blogRoutes,
  ];
}
