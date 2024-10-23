import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { type ReactNode } from "react";
import AppHeader from "@/components/(apps)/app-header";
import AppNav from "@/components/(apps)/app-nav";
import { apps } from "@/lib/apps";

type Params = Promise<{ title: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { title } = await params;
  const decodedTitle = decodeURIComponent(title);
  const app = apps.find((app) => app.title === decodedTitle);
  if (!app) {
    notFound();
  }

  return {
    title: `${app.title} - The Hidden Gaming Lair`,
    description: app.description,
    authors: [{ name: app.author.name }],
    openGraph: {
      images: [app.tileSrc],
    },
    alternates: {
      canonical: `/apps/${title}`,
    },
  };
}

export default async function AppLayout({
  params,
  children,
}: {
  params: Params;
  children: ReactNode;
}) {
  const { title } = await params;
  const decodedTitle = decodeURIComponent(title);
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
