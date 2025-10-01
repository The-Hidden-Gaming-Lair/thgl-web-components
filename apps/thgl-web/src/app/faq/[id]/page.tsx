import { notFound } from "next/navigation";
import Link from "next/link";
import { faqEntries } from "@/lib/faq-entries";
import { FaqLabelBadge } from "@/components/faq-label-badge";
import { PageShell } from "@/components/page-shell";
import { DiscordMessage, Subtitle } from "@repo/ui/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const entry = faqEntries.find((q) => q.id === id);
  if (!entry) return {};
  return {
    title: `${entry.question} | FAQ – TH.GL`,
    description: `Answer to: ${entry.question}`,
    alternates: { canonical: `/faq/${entry.id}` },
    openGraph: {
      url: `/faq/${entry.id}`,
    },
  };
}

export default async function FAQDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const entry = faqEntries.find((q) => q.id === id);
  if (!entry) return notFound();

  return (
    <PageShell>
      <div className="space-y-4">
        <Subtitle title={entry.question} />

        <div className="flex flex-wrap gap-2">
          {entry.labels.map((label) => (
            <FaqLabelBadge key={label} label={label} />
          ))}
        </div>
      </div>

      <div className="text-muted-foreground text-base space-y-4">
        <DiscordMessage>{entry.answer}</DiscordMessage>
      </div>

      <div className="pt-6 border-t border-gray-800">
        <Link
          href="/faq"
          className="text-sm text-brand underline hover:text-white"
        >
          ← Back to FAQ
        </Link>
      </div>
    </PageShell>
  );
}




