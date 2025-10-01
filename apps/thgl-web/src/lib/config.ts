import { AppConfig } from "@repo/lib";

export const appConfig: AppConfig = {
  name: "thgl",
  domain: "www",
  title: "The Hidden Gaming Lair",
  supportedLocales: ["en"],
  internalLinks: [
    {
      title: "Gaming Apps",
      href: "/apps",
      description: "Explore all game tools and overlays.",
      iconName: "Grid",
    },
    {
      title: "Companion App",
      href: "/companion-app",
      description: "The all-in-one app — no Overwolf needed.",
      iconName: "MonitorSmartphone",
    },
    {
      title: "Support Me",
      href: "/support-me",
      description: "Go ad-free and unlock more features.",
      iconName: "Heart",
    },
    {
      title: "Blog",
      href: "/blog",
      description: "News, updates and guides.",
      iconName: "Newspaper",
    },
    {
      title: "Suggestions & Issues",
      href: "/suggestions-issues",
      description: "View and discuss suggestions and reported issues.",
      iconName: "MessageSquare",
    },
    {
      title: "Partner Program",
      href: "/partner-program",
      description: "Partner with The Hidden Gaming Lair.",
      iconName: "Handshake",
    },
    {
      title: "Advertise",
      href: "/advertise",
      description: "Reach Thousands of Gamers – Sponsor TH.GL",
      iconName: "Megaphone",
    },
    {
      title: "FAQ",
      href: "/faq",
      description: "Get help and common answers.",
      iconName: "HelpCircle",
    },
    {
      title: "Legal Notice",
      href: "/legal-notice",
      description: "",
      iconName: "FileText",
    },
    {
      title: "Privacy Policy",
      href: "/privacy-policy",
      description: "",
      iconName: "ShieldCheck",
    },
  ],
  appUrl: null,
  keywords: [
    "overwolf",
    "in-game overlays",
    "companion app",
    "gaming blog",
    "partner program",
  ],
} as const;
