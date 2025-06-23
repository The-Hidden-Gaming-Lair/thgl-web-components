import Link from "next/link";
import { Subtitle } from "@/components/subtitle";
import { faqEntries } from "@/lib/faq-entries";

export const metadata = {
  title: "FAQ – Frequently Asked Questions | TH.GL",
  description:
    "Find answers to common questions about TH.GL, the Companion App, ads, subscriptions, and more.",
  alternates: { canonical: "/faq" },
};

export default function FAQIndexPage() {
  return (
    <section className="space-y-12 px-4 pt-10 pb-20 max-w-2xl mx-auto">
      <div className="text-center space-y-4">
        <Subtitle>Frequently Asked Questions</Subtitle>
        <p className="text-muted-foreground">
          Frequently asked questions about TH.GL tools, subscriptions, and app
          usage.
        </p>
      </div>

      <ul className="space-y-4">
        {faqEntries.map((faq) => (
          <li key={faq.id}>
            <Link
              href={`/faq/${faq.id}`}
              className="text-brand underline text-base hover:text-white transition-colors"
            >
              {faq.question}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
