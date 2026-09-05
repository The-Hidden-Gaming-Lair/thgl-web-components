import { PageShell } from "@/games/thgl-web/components/page-shell";
import { PageHeader } from "@/games/thgl-web/components/page-header";
import Link from "next/link";

import type { JSX } from "react";

export const metadata = {
  title: "Terms of Service - The Hidden Gaming Lair",
  description:
    "The terms that apply when you use The Hidden Gaming Lair — the websites, companion apps, and the Discord community.",
  alternates: {
    canonical: "/terms-of-service",
  },
  openGraph: {
    url: "/terms-of-service",
  },
};

export default function TermsOfService(): JSX.Element {
  return (
    <PageShell className="space-y-12 max-w-4xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Terms of Service - The Hidden Gaming Lair",
            description:
              "The terms that apply when you use The Hidden Gaming Lair — the websites, companion apps, and the Discord community.",
            url: "https://www.th.gl/terms-of-service",
          }).replace(/</g, "\\u003c"),
        }}
      />
      <PageHeader
        title="Terms of Service"
        description={
          <>
            These terms apply when you use{" "}
            <a
              href="https://www.th.gl"
              className="text-primary hover:underline font-medium"
            >
              The Hidden Gaming Lair
            </a>{" "}
            — including the game subdomains (*.th.gl), the companion apps, and
            the Discord community services.
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
          <li aria-current="page">Terms of Service</li>
        </ol>
      </nav>
      <hr className="border-border" />
      {/* Provider Section */}
      <section id="provider" className="space-y-4">
        <h2 className="text-2xl font-bold">Provider &amp; Acceptance</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>
            The Hidden Gaming Lair (&quot;THGL&quot;, &quot;the service&quot;)
            is operated by Leon Machens, Steinstr. 2, 48301 Nottuln, Germany
            (see the{" "}
            <Link
              href="/legal-notice"
              className="text-primary hover:underline font-medium"
            >
              legal notice
            </Link>
            ). By using the service you accept these terms. If you do not agree
            with them, please do not use the service.
          </p>
        </div>
      </section>
      <hr className="border-border" />
      {/* Service Section */}
      <section id="service" className="space-y-4">
        <h2 className="text-2xl font-bold">The Service</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>The service consists of:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              the websites www.th.gl and the game subdomains (e.g. palia.th.gl)
              with interactive maps, guides, and tools,
            </li>
            <li>
              the desktop companion apps (THGL Companion App and the
              Overwolf-based in-game apps),
            </li>
            <li>
              the THGL Discord community, including a Discord bot that provides
              support tickets, FAQ and release-notes access, and moderation for
              that community server.
            </li>
          </ul>
          <p>
            The service is provided free of charge; optional subscriptions with
            additional perks are available via{" "}
            <Link
              href="/support-me"
              className="text-primary hover:underline font-medium"
            >
              Support Me
            </Link>
            . I may change, add, or discontinue features of the free service at
            any time.
          </p>
        </div>
      </section>
      <hr className="border-border" />
      {/* Acceptable Use Section */}
      <section id="acceptable-use" className="space-y-4">
        <h2 className="text-2xl font-bold">Acceptable Use</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              disrupt or interfere with the service, e.g. through excessive
              automated requests, scraping at scale, or attempts to bypass
              access controls,
            </li>
            <li>
              use the service for spam, harassment, or any unlawful activity,
            </li>
            <li>
              misrepresent yourself as affiliated with THGL or the game
              publishers.
            </li>
          </ul>
          <p>
            In the Discord community, the server rules and{" "}
            <a
              href="https://discord.com/terms"
              className="text-primary hover:underline font-medium"
              target="_blank"
              rel="noopener"
            >
              Discord&apos;s Terms of Service
            </a>{" "}
            additionally apply. I may remove content or restrict access
            (including bans issued by the moderation bot) to protect the
            community and the service.
          </p>
        </div>
      </section>
      <hr className="border-border" />
      {/* Subscriptions Section */}
      <section id="subscriptions" className="space-y-4">
        <h2 className="text-2xl font-bold">Subscriptions</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>
            Subscription perks (e.g. ad-free usage) are provided through
            Patreon. Billing, renewal, and cancellation are handled entirely by
            Patreon under{" "}
            <a
              href="https://www.patreon.com/policy/legal"
              className="text-primary hover:underline font-medium"
              target="_blank"
              rel="noopener"
            >
              Patreon&apos;s terms
            </a>
            . Perks remain available for the duration of an active membership.
          </p>
        </div>
      </section>
      <hr className="border-border" />
      {/* IP Section */}
      <section id="intellectual-property" className="space-y-4">
        <h2 className="text-2xl font-bold">Intellectual Property</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>
            Game names, assets, and related material belong to their respective
            publishers and are used for informational purposes. THGL is a fan
            project and is not affiliated with or endorsed by the game
            publishers. The service&apos;s own content, code, and design remain
            the property of the provider.
          </p>
        </div>
      </section>
      <hr className="border-border" />
      {/* Disclaimer Section */}
      <section id="disclaimer" className="space-y-4">
        <h2 className="text-2xl font-bold">
          Disclaimer &amp; Limitation of Liability
        </h2>
        <div className="space-y-3 text-muted-foreground">
          <p>
            The service is provided &quot;as is&quot; without warranty of
            availability, accuracy, or fitness for a particular purpose. Game
            data can become outdated when games change.
          </p>
          <p>
            I am liable without limitation for intent and gross negligence. For
            simple negligence I am only liable for damages resulting from the
            breach of essential contractual obligations, limited to the
            typically foreseeable damage. Liability for injury to life, body, or
            health remains unaffected.
          </p>
        </div>
      </section>
      <hr className="border-border" />
      {/* Privacy Section */}
      <section id="privacy" className="space-y-4">
        <h2 className="text-2xl font-bold">Privacy</h2>
        <p className="text-muted-foreground">
          How personal data is handled is described in the{" "}
          <Link
            href="/privacy-policy"
            className="text-primary hover:underline font-medium"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </section>
      <hr className="border-border" />
      {/* Changes Section */}
      <section id="changes" className="space-y-4">
        <h2 className="text-2xl font-bold">Changes &amp; Governing Law</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>
            These terms may be updated over time, for example when services
            change. The current version is always published on this page. German
            law applies; mandatory consumer protection rules of your country of
            residence remain unaffected.
          </p>
          <p>
            Questions? Contact me at{" "}
            <a
              href="mailto:leon@th.gl"
              className="text-primary hover:underline font-medium"
            >
              leon@th.gl
            </a>
            .
          </p>
        </div>
      </section>
    </PageShell>
  );
}
