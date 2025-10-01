import { notFound } from "next/navigation";
import { blogEntries } from "@/lib/blog-entries";
import { LabelBadge } from "@/components/faq-label-badge";
import { PageShell } from "@/components/page-shell";
import Link from "next/link";
import { DiscordMessage, Subtitle } from "@repo/ui/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const entry = blogEntries.find((e) => e.id === id);
  if (!entry) return {};
  return {
    title: `${entry.title} | Blog – TH.GL`,
    description: entry.description,
    alternates: { canonical: `/blog/${entry.id}` },
    openGraph: {
      url: `/blog/${entry.id}`,
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const entry = blogEntries.find((e) => e.id === id);
  if (!entry) return notFound();

  return (
    <PageShell className="space-y-10">
      <Subtitle title={entry.title} />
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Published on {new Date(entry.date).toLocaleDateString()}
        </p>
        {entry.contentReference.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {entry.contentReference.map((reference) => (
              <LabelBadge key={reference} text={reference} />
            ))}
          </div>
        )}
      </div>

      <div className="text-muted-foreground text-base space-y-4">
        <DiscordMessage>{entry.content}</DiscordMessage>
      </div>

      <div>
        <Link
          href="/blog"
          className="text-sm text-brand underline hover:text-white"
        >
          ← Back to Blog
        </Link>
      </div>
    </PageShell>
  );
}
