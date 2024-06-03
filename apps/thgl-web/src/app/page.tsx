import { CardLink } from "@/components/card-link";
import { Subtitle } from "@/components/subtitle";
import { apps } from "@/lib/apps";

export default function Home() {
  return (
    <section className="space-y-8 px-4 pt-10 pb-20 text-center">
      <Subtitle>Gaming apps & tools</Subtitle>
      <p>
        TH.GL serves as a central hub for gamers seeking to enhance their gaming
        experience. The portfolio boasts a variety of gaming apps and tools,
        encompassing interactive maps for popular games, achievement trackers,
        and databases. Any questions, feedback, or suggestions? Join the Discord
        server to stay connected!
      </p>
      <div className="p-4 flex flex-wrap gap-8 justify-center">
        {apps
          .filter((app) => !app.isPartnerApp)
          .map((app) => (
            <CardLink key={app.id} app={app} />
          ))}
      </div>
      <Subtitle order={3}>Partner Apps</Subtitle>
      <p className="text-sm">
        TH.GL is proud to partner with the following apps and tools, which
        provide a variety of gaming-related services. Any questions, feedback,
        or suggestions? Join the Discord server to stay connected!
      </p>
      <div className="p-4 flex flex-wrap gap-8 justify-center">
        {apps
          .filter((app) => app.isPartnerApp)
          .map((app) => (
            <CardLink key={app.id} app={app} />
          ))}
      </div>
    </section>
  );
}
