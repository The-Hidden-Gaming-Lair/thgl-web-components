import type { Metadata } from "next";
import { HeaderOffset } from "@repo/ui/header";
import { Subtitle } from "@repo/ui/content";
import { cn } from "@repo/lib";
import Link from "next/link";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/controls";

export const metadata: Metadata = {
  alternates: {
    canonical: "/private-servers",
  },
  title: "Dune: Awakening Private Server Hosting – The Hidden Gaming Lair",
  description:
    "Get your own Dune: Awakening private server hosted on high-performance hardware. Play PvP, PvE, or roleplay with friends. Secure, fast, and easy to configure.",
};

export default async function PrivateServers() {
  return (
    <HeaderOffset full>
      <div className={cn("relative container p-6 space-y-10 mb-48")}>
        <div>
          <Subtitle title="Dune: Awakening Server Hosting" />
          <p className="text-muted-foreground text-lg">
            Set up a dedicated Dune: Awakening private server in minutes. Ideal
            for PvP clashes, immersive roleplay, or exploring Arrakis with
            friends — these servers are fast, secure, and fully customizable.
          </p>
        </div>

        <section className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">
            Start Hosting with Nitrado
          </h2>
          <p className="text-muted-foreground text-lg">
            Order your Dune: Awakening server from Nitrado using the link below
            — your support helps me directly.
          </p>
          <Link
            href="https://www.nitrado-aff.com/4B2XBP3/D42TT/?uid=59"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition"
          >
            Order Server on Nitrado
          </Link>

          <div className="mt-10 text-left max-w-2xl mx-auto space-y-6">
            <h3 className="text-xl font-semibold text-foreground">
              Why a Nitrado Gameserver?
            </h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>
                <strong>Easy Management:</strong> Install mods & plugins, manage
                servers with friends, and get multilingual support.
              </li>
              <li>
                <strong>High Reliability:</strong> Enjoy low pings, daily
                backups, DDoS protection, and premium hardware.
              </li>
              <li>
                <strong>Full Flexibility:</strong> Change runtime, switch games
                anytime, and scale your server as needed.
              </li>
              <li>
                <strong>Community Driven:</strong> Access Discord, events, and
                helpful guides built for players.
              </li>
            </ul>
          </div>
        </section>

        <Accordion type="single" collapsible className="mt-16 space-y-2">
          <h2 className="text-2xl font-bold mb-4 text-foreground">
            Frequently Asked Questions
          </h2>

          {/* FAQ items remain unchanged */}
          <AccordionItem value="faq-1">
            <AccordionTrigger>
              How do private servers work in Dune: Awakening?
            </AccordionTrigger>
            <AccordionContent>
              When renting a private server, you receive a dedicated instance
              containing one Hagga Basin — the same map as official servers. You
              can do everything as on the public servers. The server belongs to
              a World that includes other private servers. A World can be
              selected during setup. Players retain access to large-scale
              multiplayer content, including shared hubs and the Deep Desert,
              across servers in the same World.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-2">
            <AccordionTrigger>How can I move between maps?</AccordionTrigger>
            <AccordionContent>
              Travel across private servers within the same World is possible.
              This includes the ability to move between personal servers, social
              hubs, and the Deep Desert while keeping progress intact.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-3">
            <AccordionTrigger>
              How many Deep Desert maps are there?
            </AccordionTrigger>
            <AccordionContent>
              Each World contains a shared Deep Desert. All private servers
              within that World connect to the same instance, supporting a
              unified player experience.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-4">
            <AccordionTrigger>
              If I have questions or run into problems, how do I get help?
            </AccordionTrigger>
            <AccordionContent>
              Support is available via the contact form or live tech support
              provided with all server plans. Assistance is available for
              technical issues, setup, and billing.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-5">
            <AccordionTrigger>
              Can I cancel my subscription anytime?
            </AccordionTrigger>
            <AccordionContent>
              Yes, subscriptions can be canceled at any time. Access will
              continue through the remainder of the billing period.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-6">
            <AccordionTrigger>
              Can I upgrade or downgrade my server package?
            </AccordionTrigger>
            <AccordionContent>
              Absolutely. To upgrade, open your server panel, click the three
              dots next to the server name, and choose{" "}
              <strong>Manage Subscriptions</strong>. For downgrades, contact
              support for assistance.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <section className="mt-16 space-y-6 text-base text-muted-foreground">
          <h2 className="text-2xl font-bold text-foreground">
            Why Choose This Dune: Awakening Hosting?
          </h2>
          <p>
            Premium private server hosting for Dune: Awakening, built for
            performance, reliability, and simplicity. With Nitrado's
            infrastructure, you get low-latency access, robust support, and
            effortless setup.
          </p>

          <h3 className="text-xl font-semibold text-foreground">
            Unique World System
          </h3>
          <p>
            Dune: Awakening private servers are part of a larger World. This
            allows travel across servers, access to the Deep Desert, and shared
            experiences while maintaining private control over your own space.
          </p>

          <Image
            src="/private-servers.webp"
            alt="Dune: Awakening Private Servers"
            width={1920}
            height={1080}
            className="rounded-lg mt-4"
          />

          <h3 className="text-xl font-semibold text-foreground">
            Server Customization
          </h3>
          <ul className="list-disc list-inside">
            <li>Adjust PvP zones</li>
            <li>Set taxation rules</li>
            <li>Modify environmental hazards like sandstorms</li>
            <li>Name your server and set passwords</li>
          </ul>

          <p>
            Admin features are still evolving, but current tools offer plenty of
            flexibility for server owners.
          </p>

          <h3 className="text-xl font-semibold text-foreground">
            Seamless Travel & Collaboration
          </h3>
          <p>
            Players can visit other servers in the same World, making it perfect
            for community events, alliances, or rivalries — all while keeping
            character progress.
          </p>

          <h3 className="text-xl font-semibold text-foreground">
            Get Started Quickly
          </h3>
          <p>
            Hosting a Dune: Awakening server has never been easier — launch,
            manage, and enjoy your server in minutes with Nitrado's intuitive
            platform.
          </p>
        </section>

        <p className="text-sm text-muted-foreground text-center mt-12">
          Server infrastructure powered by{" "}
          <Link
            href="https://www.nitrado.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Nitrado
          </Link>
          .
        </p>
      </div>
    </HeaderOffset>
  );
}
