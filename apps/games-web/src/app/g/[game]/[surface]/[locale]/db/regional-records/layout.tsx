import { DEFAULT_LOCALE } from "@repo/lib";
import { WikiSectionLayout } from "@/lib/db/wiki";
import { requireApp } from "@/lib/get-app-config";
import { ONCE_HUMAN_SECTIONS } from "@/games/once-human/sections";

export default async function RegionalRecordsLayout({
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
      section={ONCE_HUMAN_SECTIONS["regional-records"]}
      locale={locale}
    >
      {children}
    </WikiSectionLayout>
  );
}
