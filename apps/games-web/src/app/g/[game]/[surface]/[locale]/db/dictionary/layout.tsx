import { DEFAULT_LOCALE } from "@repo/lib";
import { requireApp } from "@/lib/get-app-config";
import { BpsrSectionLayout } from "@/games/blue-protocol-star-resonance/section-layout";

export default async function DictionaryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  await requireApp("blue-protocol-star-resonance");
  const { locale = DEFAULT_LOCALE } = await params;
  return (
    <BpsrSectionLayout segment="dictionary" locale={locale}>
      {children}
    </BpsrSectionLayout>
  );
}
