import { PageShell } from "@/games/thgl-web/components/page-shell";
import { PageHeader } from "@/games/thgl-web/components/page-header";
import Link from "next/link";

import type { JSX } from "react";

export const metadata = {
  title: "Legal Notice (Impressum) – The Hidden Gaming Lair",
  description:
    "Legal information and website ownership details for The Hidden Gaming Lair. Provided in accordance with § 5 TMG (Germany).",
  alternates: {
    canonical: "/legal-notice",
  },
  openGraph: {
    url: "/legal-notice",
  },
};

export default function LegalNotice(): JSX.Element {
  return (
    <PageShell className="space-y-12 max-w-4xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Legal Notice (Impressum) – The Hidden Gaming Lair",
            description:
              "Legal information and website ownership details for The Hidden Gaming Lair. Provided in accordance with § 5 TMG (Germany).",
            url: "https://www.th.gl/legal-notice",
          }).replace(/</g, "\\u003c"),
        }}
      />
      <PageHeader
        title="Legal Notice / Impressum"
        description="Angaben gemäß § 5 TMG / In accordance with Section 5 of the German Telemedia Act."
      />
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <ol className="flex items-center gap-1">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Legal Notice</li>
        </ol>
      </nav>
      <hr className="border-border" />
      {/* Website Owner Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Website Owner</h2>
        <p className="text-muted-foreground">
          <a
            href="https://leon-machens.dev"
            className="text-primary hover:underline font-medium"
            target="_blank"
            rel="noopener"
          >
            Leon Machens
          </a>
        </p>
      </section>
      <hr className="border-border" />
      {/* Contact Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Contact</h2>
        <div className="space-y-2 text-muted-foreground">
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
        </div>
      </section>
      <hr className="border-border" />
      {/* Disclaimer Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Disclaimer</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>
            This is a commercial project. Revenue is generated through ads and
            subscriptions.
          </p>
          <p>
            Content responsibility in accordance with § 55 Abs. 2 RStV: Leon
            Machens, Nottuln, Germany.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
