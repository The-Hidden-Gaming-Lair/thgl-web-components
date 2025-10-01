import { BlogList } from "@/components/blog-list";
import { PageShell } from "@/components/page-shell";
import { Subtitle } from "@repo/ui/content";

export const metadata = {
  title: "Blog – The Hidden Gaming Lair",
  description:
    "Updates, game guides, new feature announcements, and development insights from TH.GL",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogPage() {
  return (
    <PageShell className="space-y-10">
      <div className="text-center space-y-4">
        <Subtitle title="Blog & Updates" />
        <p className="text-muted-foreground">
          Announcements, behind-the-scenes, guides, and more from The Hidden
          Gaming Lair.
        </p>
      </div>

      <BlogList />
    </PageShell>
  );
}
