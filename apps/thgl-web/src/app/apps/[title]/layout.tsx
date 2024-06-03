import AppHeader from "@/components/(apps)/app-header";
import AppNav from "@/components/(apps)/app-nav";
import { apps } from "@/lib/apps";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

type Props = {
  params: { title: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const decodedTitle = decodeURIComponent(params.title);
  const app = apps.find((app) => app.title === decodedTitle);
  if (!app) {
    notFound();
  }

  return {
    title: app.title + " - The Hidden Gaming Lair",
    description: app.description,
    authors: [{ name: app.author.name }],
    openGraph: {
      images: [app.tileSrc],
    },
    alternates: {
      canonical: `/apps/${params.title}`,
    },
  };
}

export default function AppLayout({
  params,
  children,
}: Props & {
  children: ReactNode;
}) {
  const decodedTitle = decodeURIComponent(params.title);
  const app = apps.find((app) => app.title === decodedTitle);
  if (!app) {
    notFound();
  }

  return (
    <>
      <AppHeader app={app} />
      <AppNav />
      {children}
    </>
  );
}
