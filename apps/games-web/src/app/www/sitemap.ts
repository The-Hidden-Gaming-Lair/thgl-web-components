import { blogEntries } from "@/games/thgl-web/lib/blog-entries";
import { faqEntries } from "@/games/thgl-web/lib/faq-entries";
import { games, getSuggestionsAndIssues } from "@repo/lib";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    lastModified: new Date(entry.date),
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  const suggestionsIssues = await getSuggestionsAndIssues(100);
  const suggestionsIssuesRoutes: MetadataRoute.Sitemap = suggestionsIssues.map(
    (post) => ({
      url: `https://www.th.gl/suggestions-issues/${encodeURIComponent(post.id)}`,
      lastModified: new Date(post.createdAt),
      changeFrequency: "weekly",
      priority: 0.6,
    }),
  );

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
      url: "https://www.th.gl/terms-of-service",
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
    {
      url: "https://www.th.gl/suggestions-issues",
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...appRoutes,
    ...faqRoutes,
    ...blogRoutes,
    ...suggestionsIssuesRoutes,
  ];
}
