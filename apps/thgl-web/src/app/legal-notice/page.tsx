import { Subtitle } from "@repo/ui/content";

export const metadata = {
  title: "Legal Notice (Impressum) – The Hidden Gaming Lair",
  description:
    "Legal information and website ownership details for The Hidden Gaming Lair. Provided in accordance with § 5 TMG (Germany).",
  alternates: {
    canonical: "/legal-notice",
  },
};

export default function LegalNotice(): JSX.Element {
  return (
    <section className="space-y-10 px-4 pt-10 pb-20 mx-auto">
      <div className="text-center space-y-4">
        <Subtitle title="Legal Notice / Impressum" />
        <p className="text-muted-foreground text-sm">
          Angaben gemäß § 5 TMG / In accordance with Section 5 of the German
          Telemedia Act.
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="font-bold text-lg">Website Owner</h2>
        <p>Leon Machens</p>
      </div>

      <div className="space-y-2">
        <h2 className="font-bold text-lg">Contact</h2>
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
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <h2 className="font-bold text-lg">Disclaimer</h2>
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
  );
}
