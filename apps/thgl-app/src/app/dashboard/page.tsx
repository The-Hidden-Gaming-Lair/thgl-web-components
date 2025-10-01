import { DiscordMessage, Subtitle } from "@repo/ui/content";
import { AppCard, Status } from "@repo/ui/thgl-app";
import { ScrollArea } from "@repo/ui/controls";
import { THGLDashboardAds } from "@repo/ui/ads";
import { getCurrentVersion } from "@/version";
import { games } from "@repo/lib";

export default async function Dashboard() {
  const currentVersion = await getCurrentVersion();

  const companionGames = games.filter((game) => game.companion);

  return (
    <div className="flex mt-[32px] w-full">
      <ScrollArea className="w-full">
        <div className="p-4 space-y-4">
          <Subtitle title="Status" />
          <Status />

          <Subtitle title="Apps" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {companionGames.map((game) => (
              <AppCard key={game.id} game={game} />
            ))}
          </div>

          {/* <FloatingAds id="THGL_Dashboard" /> */}
        </div>
      </ScrollArea>
      <div className="w-[400px] flex flex-col shrink-0">
        <ScrollArea>
          <div className="p-4 space-y-4">
            <Subtitle title="Updates" />
            <DiscordMessage>{currentVersion.changelog}</DiscordMessage>
          </div>
        </ScrollArea>
        <THGLDashboardAds />
      </div>
    </div>
  );
}
