import { PageShell } from "@/games/thgl-web/components/page-shell";
import { PageHeader } from "@/games/thgl-web/components/page-header";
import Link from "next/link";

import type { JSX } from "react";

export const metadata = {
  title: "Privacy Policy - The Hidden Gaming Lair",
  description:
    "How The Hidden Gaming Lair collects and uses your data. No tracking on www.th.gl. Subscriptions use cookies for account management.",
  alternates: {
    canonical: "/privacy-policy",
  },
  openGraph: {
    url: "/privacy-policy",
  },
};

export default function PrivacyPolicy(): JSX.Element {
  return (
    <PageShell className="space-y-12 max-w-4xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Privacy Policy - The Hidden Gaming Lair",
            description:
              "How The Hidden Gaming Lair collects and uses your data. No tracking on www.th.gl. Subscriptions use cookies for account management.",
            url: "https://www.th.gl/privacy-policy",
          }).replace(/</g, "\\u003c"),
        }}
      />
      <PageHeader
        title="Privacy Policy"
        description={
          <>
            This Privacy Policy explains how I collect, use, and protect your
            information when you use{" "}
            <a
              href="https://www.th.gl"
              className="text-primary hover:underline font-medium"
            >
              The Hidden Gaming Lair
            </a>{" "}
            — including the game subdomains (*.th.gl) and the companion apps.
          </>
        }
      />
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <ol className="flex items-center gap-1">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Privacy Policy</li>
        </ol>
      </nav>
      <hr className="border-border" />
      {/* Controller Section */}
      <section id="controller" className="space-y-4">
        <h2 className="text-2xl font-bold">Controller</h2>
        <div className="space-y-2 text-muted-foreground">
          <p>
            The controller responsible for data processing on this site within
            the meaning of Art. 4(7) GDPR is:
          </p>
          <p className="text-foreground">
            Leon Machens
            <br />
            Steinstr. 2
            <br />
            48301 Nottuln, Germany
            <br />
            Email:{" "}
            <a
              href="mailto:leon@th.gl"
              className="text-primary hover:underline font-medium"
            >
              leon@th.gl
            </a>
          </p>
        </div>
      </section>
      <hr className="border-border" />
      {/* Hosting Section */}
      <section id="hosting" className="space-y-4">
        <h2 className="text-2xl font-bold">Hosting &amp; Server Logs</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>
            This site runs on servers rented from Hetzner Online GmbH (data
            centers in the EU and the USA) and is delivered through the CDN
            bunny.net (BunnyWay d.o.o., Slovenia, EU). When you access any page,
            technically necessary data is processed in server logs: IP address,
            date and time, requested URL, referrer, browser and operating
            system.
          </p>
          <p>
            This data is required to deliver the site and to ensure the security
            and stability of the service. It is not merged with other data
            sources and is deleted after a short period. Legal basis: Art.
            6(1)(f) GDPR (legitimate interest in operating the service).
          </p>
        </div>
      </section>
      <hr className="border-border" />
      {/* Analytics Section */}
      <section id="analytics" className="space-y-4">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>
            The <strong className="text-foreground">www.th.gl</strong> website
            does not use tracking cookies or display ads.
          </p>
          <p>
            For anonymous usage statistics I use a{" "}
            <strong className="text-foreground">self-hosted</strong> instance of{" "}
            <a
              href="https://plausible.io"
              className="text-primary hover:underline font-medium"
              target="_blank"
            >
              Plausible Analytics
            </a>{" "}
            running on my own infrastructure. It works without cookies, does not
            collect personal information, does not track visitors across
            websites, and no data is shared with third parties. Legal basis:
            Art. 6(1)(f) GDPR (legitimate interest in anonymous reach
            measurement).
          </p>
        </div>
      </section>
      <hr className="border-border" />
      {/* Account Section */}
      <section id="account" className="space-y-4">
        <h2 className="text-2xl font-bold">Account &amp; Subscriptions</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>
            When you sign in via Patreon at{" "}
            <Link
              href="/support-me/account"
              className="text-primary hover:underline font-medium"
            >
              /support-me/account
            </Link>
            , I receive your Patreon user ID and membership status from Patreon
            Inc. (USA) in order to unlock your subscription perks. A cookie
            containing a secure authentication token (JWT) is stored on your
            device so that your perks work across the *.th.gl network and the
            companion apps.
          </p>
          <p>
            This cookie is strictly necessary for the service you request — it
            is not used for tracking or advertising. Legal basis: Art. 6(1)(b)
            GDPR (performance of the agreement) and § 25(2) No. 2 TDDDG; no
            consent banner is required for it. The cookie remains until it
            expires or until you remove it via the &quot;Sign out&quot; button
            on the same page.
          </p>
          <p>
            The sign-in and payment process itself is handled by Patreon; see
            the{" "}
            <a
              href="https://www.patreon.com/privacy"
              className="text-primary hover:underline font-medium"
              target="_blank"
              rel="noopener"
            >
              Patreon Privacy Policy
            </a>{" "}
            for details. The data exchange with Patreon takes place when you
            actively initiate the sign-in (Art. 6(1)(b) GDPR).
          </p>
        </div>
      </section>
      <hr className="border-border" />
      {/* Advertising Section */}
      <section id="advertising" className="space-y-4">
        <h2 className="text-2xl font-bold">
          Advertising on Game Subdomains &amp; Apps
        </h2>
        <div className="space-y-3 text-muted-foreground">
          <p>
            The game subdomains (e.g. palia.th.gl, palworld.th.gl) and the
            in-game apps are financed through advertising for users without a
            subscription. Ads are delivered by{" "}
            <a
              href="https://nitropay.com"
              className="text-primary hover:underline font-medium"
              target="_blank"
              rel="noopener"
            >
              NitroPay
            </a>{" "}
            (USA) on the web and by{" "}
            <a
              href="https://www.overwolf.com/legal/privacy"
              className="text-primary hover:underline font-medium"
              target="_blank"
              rel="noopener"
            >
              Overwolf
            </a>{" "}
            in the Overwolf-based apps. These services may use cookies or
            similar technologies and process data (e.g. IP address, device
            information) to deliver and measure ads, which can involve transfers
            to the USA.
          </p>
          <p>
            Personalized advertising only runs with your consent: on the
            affected pages a consent dialog (CMP) is shown before such cookies
            are set. Legal basis: Art. 6(1)(a) GDPR and § 25(1) TDDDG. You can
            withdraw or change your choices at any time via the consent settings
            on those pages; without consent, ads are non-personalized or absent.
          </p>
          <p>
            Subscribers can remove ads entirely — see{" "}
            <Link
              href="/support-me"
              className="text-primary hover:underline font-medium"
            >
              Support Me
            </Link>
            .
          </p>
        </div>
      </section>
      <hr className="border-border" />
      {/* Data Security Section */}
      <section id="data-security" className="space-y-4">
        <h2 className="text-2xl font-bold">Data Security</h2>
        <p className="text-muted-foreground">
          I take appropriate technical and organizational measures to protect
          stored tokens and usage data from unauthorized access, misuse, or
          loss.
        </p>
      </section>
      <hr className="border-border" />
      {/* Your Rights Section */}
      <section id="your-rights" className="space-y-4">
        <h2 className="text-2xl font-bold">Your Rights</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>Under the GDPR you have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>access the personal data I store about you (Art. 15),</li>
            <li>rectification of inaccurate data (Art. 16),</li>
            <li>erasure (Art. 17) and restriction of processing (Art. 18),</li>
            <li>data portability (Art. 20),</li>
            <li>
              object to processing based on legitimate interest (Art. 21),
            </li>
            <li>
              withdraw any consent at any time with effect for the future (Art.
              7(3)).
            </li>
          </ul>
          <p>
            You also have the right to lodge a complaint with a data protection
            supervisory authority (Art. 77 GDPR). The authority responsible for
            me is the Landesbeauftragte für Datenschutz und Informationsfreiheit
            Nordrhein-Westfalen (
            <a
              href="https://www.ldi.nrw.de"
              className="text-primary hover:underline font-medium"
              target="_blank"
              rel="noopener"
            >
              ldi.nrw.de
            </a>
            ).
          </p>
        </div>
      </section>
      <hr className="border-border" />
      {/* Contact Section */}
      <section id="contact" className="space-y-4">
        <h2 className="text-2xl font-bold">Contact</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>For privacy-related questions or requests, you can contact me:</p>
          <p>
            Email:{" "}
            <a
              href="mailto:leon@th.gl"
              className="text-primary hover:underline font-medium"
            >
              leon@th.gl
            </a>
          </p>
          <p>
            Discord:{" "}
            <a
              href="https://th.gl/discord"
              className="text-primary hover:underline font-medium"
              target="_blank"
            >
              devleon
            </a>
          </p>
          <p>
            Website:{" "}
            <a
              href="https://leon-machens.dev"
              className="text-primary hover:underline font-medium"
              target="_blank"
              rel="noopener"
            >
              leon-machens.dev
            </a>
          </p>
        </div>
      </section>
      <hr className="border-border" />
      {/* Policy Changes Section */}
      <section id="policy-changes" className="space-y-4">
        <h2 className="text-2xl font-bold">Policy Changes</h2>
        <p className="text-muted-foreground">
          This policy may be updated over time, for example when services
          change. The current version is always published on this page; material
          changes will be highlighted here.
        </p>
      </section>
    </PageShell>
  );
}
