import { Subtitle } from "@/components/subtitle";
import {
  Button,
  Card,
  CardContent,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@repo/ui/controls";
import { Download, MonitorSmartphone, Info } from "lucide-react";
import Image from "next/image";

export const metadata = {
  title: "TH.GL Companion App – Interactive Game Maps & Overlays",
  description:
    "Install the TH.GL Companion App for real-time maps, minimaps, and second-screen overlays. Supports Palworld, Wuthering Waves, Once Human, and more.",
  alternates: {
    canonical: "/companion-app",
  },
};

export default function CompanionAppPage() {
  return (
    <section className="space-y-12 px-4 pt-10 pb-20 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <Subtitle>Maps, Overlays & Second-Screen Tools</Subtitle>
        <p className="text-lg text-muted-foreground">
          Install the TH.GL Companion App on your Windows PC to access powerful
          overlays and second-screen tools across supported games. No Overwolf
          required!
        </p>
        <Button size="lg" className="mt-4" asChild>
          <a href="https://app.th.gl/THGL_Installer.exe" download>
            <Download className="mr-2 h-4 w-4" /> Download for Windows
          </a>
        </Button>
      </div>

      <div>
        <Carousel className="w-full max-w-3xl mx-auto">
          <CarouselContent>
            <CarouselItem>
              <Image
                src="/images/overlay-palworld.webp"
                alt="Palworld overlay with live map"
                width={900}
                height={500}
                className="rounded-lg object-cover"
              />
            </CarouselItem>
            <CarouselItem>
              <Image
                src="/images/second-screen.webp"
                alt="Second screen view of the companion app"
                width={900}
                height={500}
                className="rounded-lg object-cover"
              />
            </CarouselItem>
            <CarouselItem>
              <Image
                src="/images/app-launcher.webp"
                alt="Companion app launcher interface"
                width={900}
                height={500}
                className="rounded-lg object-cover"
              />
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 space-y-2">
            <MonitorSmartphone className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">In-Game Overlays</h2>
            <p className="text-sm text-muted-foreground">
              Interactive maps and minimaps that show your live player position
              and nearby points of interest — all directly within your game.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-2">
            <MonitorSmartphone className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Second Screen Mode</h2>
            <p className="text-sm text-muted-foreground">
              Prefer a separate display? Switch to second-screen mode without
              needing another browser. Perfect for tracking, routing, or
              managing multiple maps.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-2">
            <Info className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Privacy-Conscious</h2>
            <p className="text-sm text-muted-foreground">
              The app runs locally and uses Plausible for anonymous analytics.
              Ads are served through Nitro — subscribing removes them
              completely.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-2">
            <Info className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Supports Popular Games</h2>
            <p className="text-sm text-muted-foreground">
              Currently supports Palworld, Infinity Nikki, Once Human, Wuthering
              Waves, and more. New titles are added regularly based on community
              feedback.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-sm text-muted-foreground text-center">
        Need help? Visit the{" "}
        <a href="/faq" className="underline">
          FAQ
        </a>{" "}
        or join the{" "}
        <a href="https://th.gl/discord" className="underline">
          Discord server
        </a>
        .
      </div>
    </section>
  );
}
