import { DEFAULT_LOCALE } from "@repo/lib";
import { WikiSectionLayout } from "@/lib/db/wiki";
import { requireApp } from "@/lib/get-app-config";
import { localizedSection } from "@/games/once-human/sections";

export default async function EchoesOfStardustLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  await requireApp("once-human");
  const { locale = DEFAULT_LOCALE } = await params;
  return (
    <WikiSectionLayout
      appName="once-human"
      section={await localizedSection("echoes-of-stardust", locale)}
      locale={locale}
    >
      {children}
    </WikiSectionLayout>
  );
}
