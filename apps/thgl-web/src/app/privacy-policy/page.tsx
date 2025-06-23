import { NitroScript } from "@repo/ui/ads";
import { Subtitle } from "@/components/subtitle";

export const metadata = {
  title: "Privacy Policy - The Hidden Gaming Lair",
  description:
    "How The Hidden Gaming Lair collects and uses your data. No tracking on www.th.gl. Subscriptions use cookies for account management.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicy(): JSX.Element {
  return (
    <section className="space-y-10 px-4 pt-10 pb-20 max-w-2xl mx-auto">
      <div className="text-center space-y-4">
        <Subtitle>Privacy Policy</Subtitle>
        <p>
          This Privacy Policy explains how I collect, use, and protect your
          information when you use{" "}
          <a href="https://www.th.gl" className="underline">
            The Hidden Gaming Lair
          </a>{" "}
          and its related tools.
        </p>
      </div>

      <section id="data-collection" className="space-y-4">
        <h2 className="font-bold text-lg">Data Collection</h2>
        <p>
          The <strong>www.th.gl</strong> website does not use tracking cookies
          or display ads.
        </p>
        <p>
          I use{" "}
          <a
            href="https://plausible.io"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Plausible Analytics
          </a>{" "}
          to collect anonymous usage data. No personal information is stored or
          tracked.
        </p>
        <p>
          Some <strong>subdomains</strong> and <strong>In-Game apps</strong> may
          serve ads via NitroPay or Overwolf. These third-party services may use
          cookies or personalization for ad delivery. Their own consent banners
          and privacy tools apply on those sites.
        </p>
      </section>

      <section id="cookies" className="space-y-4">
        <h2 className="font-bold text-lg">Cookies</h2>
        <p>
          When you log in via Patreon at{" "}
          <a href="/support-me/account" className="underline">
            /support-me/account
          </a>
          , I store a cookie that contains a secure authentication token (JWT).
          This token is used to unlock your subscription perks on the *.th.gl
          network (e.g., Overwolf apps or web-based tools).
        </p>
        <p>
          The cookie is not used for tracking or advertising and can be removed
          at any time via the "Sign out" button on the same page.
        </p>
      </section>

      <section id="data-security" className="space-y-4">
        <h2 className="font-bold text-lg">Data Security</h2>
        <p>
          I take appropriate steps to protect stored tokens and anonymous usage
          data from unauthorized access, misuse, or loss.
        </p>
      </section>

      <section id="contact" className="space-y-4">
        <h2 className="font-bold text-lg">Contact</h2>
        <p>For privacy-related questions or requests, you can contact me:</p>
        <p>
          Email:{" "}
          <span className="select-all">leon.machens (at) gmail (dot) com</span>
        </p>
        <p>
          Discord:{" "}
          <a
            href="https://th.gl/discord"
            className="underline text-brand"
            target="_blank"
            rel="noopener noreferrer"
          >
            devleon
          </a>
        </p>
      </section>

      <section id="policy-changes" className="space-y-4">
        <h2 className="font-bold text-lg">Policy Changes</h2>
        <p>
          This policy may be updated over time. Changes will be published here
          and apply immediately upon posting.
        </p>
      </section>
    </section>
  );
}
