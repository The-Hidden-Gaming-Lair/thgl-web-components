import { ClientAppsPage } from "./client";

export const metadata = {
  title: "Game Tools & Overlays – Interactive Maps, Apps & Trackers | TH.GL",
  description:
    "Browse Companion Apps, Overwolf tools, and web-based utilities with real-time overlays, maps, and trackers. Supports Palworld, Palia, Once Human, and more.",
  alternates: {
    canonical: "/apps",
  },
};

export default function AppsPage() {
  return <ClientAppsPage />;
}
