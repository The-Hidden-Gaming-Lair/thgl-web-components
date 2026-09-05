import { PageShell } from "@/games/thgl-web/components/page-shell";
import { PageHeader } from "@/games/thgl-web/components/page-header";
import Link from "next/link";

import type { JSX } from "react";

export const metadata = {
  title: "Legal Notice (Impressum) – The Hidden Gaming Lair",
  description:
    "Legal information and website ownership details for The Hidden Gaming Lair. Provided in accordance with § 5 DDG (Germany).",
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
              "Legal information and website ownership details for The Hidden Gaming Lair. Provided in accordance with § 5 DDG (Germany).",
            url: "https://www.th.gl/legal-notice",
          }).replace(/</g, "\\u003c"),
        }}
      />
      <PageHeader
        title="Legal Notice / Impressum"
        description="Angaben gemäß § 5 DDG / In accordance with Section 5 of the German Digital Services Act (Digitale-Dienste-Gesetz)."
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
        <div className="space-y-1 text-muted-foreground">
          <p>
            <a
              href="https://leon-machens.dev"
              className="text-primary hover:underline font-medium"
              target="_blank"
              rel="noopener"
            >
              Leon Machens
            </a>
          </p>
          <p>Steinstr. 2</p>
          <p>48301 Nottuln</p>
          <p>Germany</p>
        </div>
      </section>
      <hr className="border-border" />
      {/* Contact Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Contact</h2>
        <div className="space-y-2 text-muted-foreground">
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
        </div>
      </section>
      <hr className="border-border" />
      {/* VAT Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">VAT ID</h2>
        <p className="text-muted-foreground">
          VAT identification number according to § 27a Umsatzsteuergesetz
          (German VAT Act):{" "}
          <span className="text-foreground select-all">DE330174479</span>
        </p>
      </section>
      <hr className="border-border" />
      {/* Editorial Responsibility Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Editorial Responsibility</h2>
        <p className="text-muted-foreground">
          Responsible for editorial content in accordance with § 18 Abs. 2 MStV
          (German Interstate Media Treaty): Leon Machens, Steinstr. 2, 48301
          Nottuln, Germany.
        </p>
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
            The apps and developers featured on this site are not affiliated
            with the respective game companies. All trademarks, service marks,
            trade names, product names, and logos appearing on this site are the
            property of their respective owners.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
