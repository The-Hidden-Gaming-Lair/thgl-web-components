import Link from "next/link";
import { ContentLayout } from "@repo/ui/ads";
import { Button } from "@repo/ui/controls";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import { getAppConfig } from "@/lib/get-app-config";

// The game tenants' 404 (a missing codex entry, guide, map …). Laid out like every other tenant
// page — HeaderOffset clears the fixed header, ContentLayout carries the ad rails — so the text
// no longer sits under the header. Without this file Next rendered its bare built-in
// "This page could not be found" inside the tenant layout.
export default async function NotFound() {
  const appConfig = await getAppConfig();
  return (
    <HeaderOffset full>
      <ContentLayout
        id={appConfig.name}
        header={<PageTitle title="Page Not Found" />}
        content={
          <div className="space-y-6 py-4">
            <p className="text-muted-foreground text-sm">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Button asChild>
                <Link href="/">Go to Homepage</Link>
              </Button>
              <Link
                href="https://th.gl/discord"
                target="_blank"
                className="text-sm underline text-muted-foreground hover:text-white"
              >
                Contact us on Discord
              </Link>
            </div>
          </div>
        }
      />
    </HeaderOffset>
  );
}
