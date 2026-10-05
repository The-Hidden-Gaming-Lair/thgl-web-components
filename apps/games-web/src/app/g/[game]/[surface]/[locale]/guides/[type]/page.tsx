import { DEFAULT_LOCALE, fetchGuide } from "@repo/lib";
import {
  createGuidePage,
  createGuidePageGenerateMetadata,
} from "@repo/ui/apps";
import { getAppConfig } from "@/lib/get-app-config";
import {
  WrittenGuidePage,
  writtenGuideMetadata,
} from "@/lib/guides/written-guide";

type PageProps = { params: Promise<{ locale?: string; type: string }> };

/**
 * `/guides/<slug>`: a written guide (data-forge `config/guides/<slug>.json`) when one
 * has this slug — English only for now — else the per-type location guide.
 */
async function writtenGuideFor(props: PageProps) {
  const { locale = DEFAULT_LOCALE, type } = await props.params;
  const appConfig = await getAppConfig();
  if (locale !== DEFAULT_LOCALE) return { appConfig, guide: null };
  const guide = await fetchGuide(appConfig.name, decodeURIComponent(type));
  return { appConfig, guide };
}

export async function generateMetadata(props: PageProps) {
  const { appConfig, guide } = await writtenGuideFor(props);
  if (guide) return writtenGuideMetadata(appConfig, guide);
  return createGuidePageGenerateMetadata(appConfig)(props);
}

export default async function Page(props: PageProps) {
  const { appConfig, guide } = await writtenGuideFor(props);
  if (guide) return <WrittenGuidePage appConfig={appConfig} guide={guide} />;
  return createGuidePage(appConfig)(props);
}
