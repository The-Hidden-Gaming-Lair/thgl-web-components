import type { Metadata } from "next";
import { HeaderOffset } from "@repo/ui/header";
import { Subtitle } from "@repo/ui/content";
import { cn, getMetadataAlternates, getT, translate } from "@repo/lib";
import Link from "next/link";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
} from "@repo/ui/controls";
import { APP_CONFIG } from "@/config";
import { getStaticDictionary } from "@repo/ui/dicts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale ?? "en";
  const dict = await getStaticDictionary(APP_CONFIG.name, locale);
  const t = getT(dict);

  const { canonical, languageAlternates } = getMetadataAlternates(
    "/private-servers",
    locale,
    APP_CONFIG.supportedLocales,
  );

  return {
    alternates: {
      canonical: canonical,
      languages: languageAlternates,
    },
    title: t("privateServers.meta.title"),
    description: t("privateServers.meta.description"),
  };
}

export default async function PrivateServers({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const locale = (await params).locale ?? "en";
  const dict = await getStaticDictionary(APP_CONFIG.name, locale);
  const t = getT(dict);

  return (
    <HeaderOffset full>
      <div className={cn("relative container p-6 space-y-10 mb-48")}>
        <div>
          <Subtitle title={t("privateServers.title")} />
          <p className="text-muted-foreground text-lg">
            {t("privateServers.description")}
          </p>
        </div>

        <section className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">
            {t("privateServers.hosting.title")}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("privateServers.hosting.description")}
          </p>
          <Button asChild variant="default" className="mt-4">
            <Link
              href="https://www.nitrado-aff.com/4B2XBP3/D42TT/?uid=59"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("privateServers.hosting.button")}
            </Link>
          </Button>

          <section className="text-center mt-6 space-y-4">
            <h3 className="text-xl font-semibold text-foreground">
              {t("privateServers.discount.title")}{" "}
              <code className="bg-muted px-2 py-1 rounded text-primary font-mono select-text">
                THGLSUMMER
              </code>
            </h3>
            <p className="text-muted-foreground text-base">
              {t("privateServers.discount.description")}
            </p>
            <p className="text-sm text-muted-foreground italic">
              {t("privateServers.discount.hint")}
            </p>
            <Image
              src="/discount.webp"
              alt={t("privateServers.discount.imageAlt")}
              width={489}
              height={600}
              className="mx-auto rounded-lg shadow-lg"
            />
          </section>

          <div className="mt-10 text-left max-w-2xl mx-auto space-y-6">
            <h3 className="text-xl font-semibold text-foreground">
              {t("privateServers.why.title")}
            </h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <li key={i}>{t(`privateServers.why.list.${i}`)}</li>
              ))}
            </ul>
          </div>
        </section>

        <Accordion type="single" collapsible className="mt-16 space-y-2">
          <h2 className="text-2xl font-bold mb-4 text-foreground">
            {t("privateServers.faq.title")}
          </h2>

          {[1, 2, 3, 4, 5, 6].map((i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger>
                {t(`privateServers.faq.q${i}`)}
              </AccordionTrigger>
              <AccordionContent>
                {t(`privateServers.faq.a${i}`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <section className="mt-16 space-y-6 text-base text-muted-foreground">
          <h2 className="text-2xl font-bold text-foreground">
            {t("privateServers.benefits.title")}
          </h2>
          <p>{t("privateServers.benefits.description")}</p>

          <h3 className="text-xl font-semibold text-foreground">
            {t("privateServers.benefits.world.title")}
          </h3>
          <p>{t("privateServers.benefits.world.description")}</p>

          <Image
            src="/private-servers.webp"
            alt={t("privateServers.benefits.imageAlt")}
            width={1920}
            height={1080}
            className="rounded-lg mt-4"
          />

          <h3 className="text-xl font-semibold text-foreground">
            {t("privateServers.benefits.custom.title")}
          </h3>
          <ul className="list-disc list-inside">
            {[0, 1, 2, 3].map((i) => (
              <li key={i}>{t(`privateServers.benefits.custom.list.${i}`)}</li>
            ))}
          </ul>
          <p>{t("privateServers.benefits.custom.description")}</p>

          <h3 className="text-xl font-semibold text-foreground">
            {t("privateServers.benefits.travel.title")}
          </h3>
          <p>{t("privateServers.benefits.travel.description")}</p>

          <h3 className="text-xl font-semibold text-foreground">
            {t("privateServers.benefits.quickStart.title")}
          </h3>
          <p>{t("privateServers.benefits.quickStart.description")}</p>
        </section>

        <p className="text-sm text-muted-foreground text-center mt-12">
          {t("privateServers.footer.poweredBy")}{" "}
          <Link
            href="https://www.nitrado.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Nitrado
          </Link>
          .
        </p>
      </div>
    </HeaderOffset>
  );
}
