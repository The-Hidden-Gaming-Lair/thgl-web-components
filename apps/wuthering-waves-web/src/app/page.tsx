import { ContentLayout } from "@repo/ui/ads";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import type { Metadata } from "next";
import { NavGrid, ReleaseNotes, Subtitle } from "@repo/ui/content";
import { getUpdateMessages } from "@repo/lib";
import { APP_CONFIG } from "@/config";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  title: `${APP_CONFIG.title} Interactive Maps & Locations – The Hidden Gaming Lair`,
  description: `Explore ${APP_CONFIG.title} interactive maps for Avinoleum, Tethys' Deep and Vault Underground, featuring ${APP_CONFIG.keywords!.join(", ")}, and more locations. Stay updated with the latest map updates and guides!`,
  openGraph: {
    url: `/`,
  },
};
export default async function Home() {
  const updateMessages = await getUpdateMessages(APP_CONFIG.name);

  return (
    <HeaderOffset full>
      <PageTitle title={`${APP_CONFIG.title} Interactive Maps & Locations`} />
      <ContentLayout
        id={APP_CONFIG.name}
        header={
          <section className="space-y-4">
            <Subtitle title={`${APP_CONFIG.title} Interactive Maps`} />
            <p className="text-muted-foreground">
              Explore Tethys' Deep Map and Vault Underground Map in Wuthering
              Waves with {APP_CONFIG.keywords!.join(", ")}, plus more locations
              brought you by{" "}
              <span className="text-nowrap">The Hidden Gaming Lair</span>!
            </p>

            {APP_CONFIG.internalLinks ? (
              <NavGrid cards={APP_CONFIG.internalLinks} />
            ) : null}
          </section>
        }
        content={<ReleaseNotes updateMessages={updateMessages} />}
      />
    </HeaderOffset>
  );
}
