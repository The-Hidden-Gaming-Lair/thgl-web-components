import { notFound } from "next/navigation";
import { Subtitle } from "@/components/subtitle";
import Link from "next/link";
import { faqEntries } from "@/lib/faq-entries";
import { DiscordMessage } from "@repo/ui/content";

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
    <section className="space-y-10 px-4 pt-10 pb-20 max-w-2xl mx-auto">
      <Subtitle>{entry.question}</Subtitle>
      <div className="text-muted-foreground text-base space-y-4">
        <DiscordMessage>{entry.answer}</DiscordMessage>
      </div>
      <div>
        <Link
          href="/faq"
          className="text-sm text-brand underline hover:text-white"
        >
          ← Back to FAQ
        </Link>
      </div>
    </section>
  );
}
