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
            and its related tools.
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
      {/* Data Collection Section */}
      <section id="data-collection" className="space-y-4">
        <h2 className="text-2xl font-bold">Data Collection</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>
            The <strong className="text-foreground">www.th.gl</strong> website
            does not use tracking cookies or display ads.
          </p>
          <p>
            I use{" "}
            <a
              href="https://plausible.io"
              className="text-primary hover:underline font-medium"
              target="_blank"
            >
              Plausible Analytics
            </a>{" "}
            to collect anonymous usage data. No personal information is stored
            or tracked.
          </p>
          <p>
            Some <strong className="text-foreground">subdomains</strong> and{" "}
            <strong className="text-foreground">In-Game apps</strong> may serve
            ads via NitroPay or Overwolf. These third-party services may use
            cookies or personalization for ad delivery. Their own consent
            banners and privacy tools apply on those sites.
          </p>
        </div>
      </section>
      <hr className="border-border" />
      {/* Cookies Section */}
      <section id="cookies" className="space-y-4">
        <h2 className="text-2xl font-bold">Cookies</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>
            When you log in via Patreon at{" "}
            <Link
              href="/support-me/account"
              className="text-primary hover:underline font-medium"
            >
              /support-me/account
            </Link>
            , I store a cookie that contains a secure authentication token
            (JWT). This token is used to unlock your subscription perks on the
            *.th.gl network (e.g., Overwolf apps or web-based tools).
          </p>
          <p>
            The cookie is not used for tracking or advertising and can be
            removed at any time via the "Sign out" button on the same page.
          </p>
        </div>
      </section>
      <hr className="border-border" />
      {/* Data Security Section */}
      <section id="data-security" className="space-y-4">
        <h2 className="text-2xl font-bold">Data Security</h2>
        <p className="text-muted-foreground">
          I take appropriate steps to protect stored tokens and anonymous usage
          data from unauthorized access, misuse, or loss.
        </p>
      </section>
      <hr className="border-border" />
      {/* Contact Section */}
      <section id="contact" className="space-y-4">
        <h2 className="text-2xl font-bold">Contact</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>For privacy-related questions or requests, you can contact me:</p>
          <p>
            Email:{" "}
            <span className="select-all text-foreground">
              leon (at) th (dot) gl
            </span>
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
          This policy may be updated over time. Changes will be published here
          and apply immediately upon posting.
        </p>
      </section>
    </PageShell>
  );
}
