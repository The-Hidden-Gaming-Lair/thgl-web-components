import { Subtitle } from "@repo/ui/content";
import { FAQList } from "@/components/faq-list";
import { PageShell } from "@/components/page-shell";

export const metadata = {
  title: "FAQ – Frequently Asked Questions | TH.GL",
  description:
    "Find answers to common questions about TH.GL, the Companion App, ads, subscriptions, and more.",
  alternates: { canonical: "/faq" },
  openGraph: {
    url: `/faq`,
  },
};

export default function FAQIndexPage() {
  return (
    <PageShell>
      <div className="text-center space-y-4">
        <Subtitle title="Frequently Asked Questions" />
        <p className="text-muted-foreground">
          Frequently asked questions about TH.GL tools, subscriptions, and app
          usage.
        </p>
      </div>

      <FAQList />
    </PageShell>
  );
}
