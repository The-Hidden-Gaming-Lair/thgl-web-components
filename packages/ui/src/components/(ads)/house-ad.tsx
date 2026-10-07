"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
  type ReactNode,
} from "react";
import {
  cn,
  games,
  getCurrentGameId,
  hasReleasedCompanion,
  isApp,
  TH_GL_URL,
  useAccountStore,
} from "@repo/lib";
import { useT } from "../(providers)";
import { trackEvent } from "../(header)/plausible-tracker";
import globalMenu from "../(header)/global-menu.json";
import { useAdBlankRound } from "./ad-fill";

type HouseCard = {
  key: "companion" | "partner" | "discord" | "adfree";
  title: string;
  body: string;
  cta: string;
  href?: string;
  onClick?: () => void;
};

const DISCORD_URL = "https://th.gl/discord";

// Illustrations in the tool-card style, one per card and slot shape:
// `<key>.webp` (600x500, rectangles), `<key>-8x1.webp` (728x90),
// `<key>-6x1.webp` (320x50), `<key>-3x1.webp` (320x100), all 2x.
// Text stays HTML (translated).
const ART_PATH = "/games/thgl-web/house-ads";

/** The current game's gaming.tools page from the game switcher's partner list. */
function partnerUrl(web: string | undefined): string | null {
  if (!web) return null;
  const app = (
    globalMenu as Array<{ url: string; partners?: Array<{ url: string }> }>
  ).find((a) => a.url === web);
  return (
    app?.partners?.find((p) => p.url.includes("gaming.tools"))?.url ?? null
  );
}

function useHouseCards(): HouseCard[] {
  const t = useT();
  const setShowUserDialog = useAccountStore((s) => s.setShowUserDialog);

  return useMemo(() => {
    const gameId = getCurrentGameId();
    const game = gameId ? games.find((g) => g.id === gameId) : undefined;
    const title = game?.title ?? "";
    const cards: HouseCard[] = [];

    // Only for visitors who don't use the app yet: not inside THGLApp /
    // Overwolf, and only on Windows (the app is Windows-only).
    const inApp =
      isApp || document.documentElement.dataset.thglSurface === "app";
    if (
      game &&
      hasReleasedCompanion(game) &&
      !inApp &&
      /Windows/.test(navigator.userAgent)
    ) {
      cards.push({
        key: "companion",
        title: t("houseAd.companion.title", {
          fallback: "{{game}} map in-game",
          vars: { game: title },
        }),
        body: t("houseAd.companion.body", {
          fallback:
            "See your live position as an overlay or on a second screen.",
        }),
        cta: t("houseAd.companion.cta", { fallback: "Get the free app" }),
        href: `${TH_GL_URL}/companion-app`,
      });
    }

    const partner = partnerUrl(game?.web);
    if (partner) {
      cards.push({
        key: "partner",
        title: t("houseAd.partner.title", {
          fallback: "{{game}} on gaming.tools",
          vars: { game: title },
        }),
        body: t("houseAd.partner.body", {
          fallback: "More databases and tools from our partner.",
        }),
        cta: t("houseAd.partner.cta", { fallback: "Visit gaming.tools" }),
        href: partner,
      });
    }

    cards.push({
      key: "discord",
      title: t("houseAd.discord.title", { fallback: "Join the THGL Discord" }),
      body: t("houseAd.discord.body", {
        fallback: "Map updates, feedback and help from the community.",
      }),
      cta: t("houseAd.discord.cta", { fallback: "Join Discord" }),
      href: DISCORD_URL,
    });

    cards.push({
      key: "adfree",
      title: t("houseAd.adfree.title", { fallback: "Go ad-free" }),
      body: t("houseAd.adfree.body", {
        fallback: "Remove ads and support the development of THGL.",
      }),
      cta: t("houseAd.adfree.cta", { fallback: "Remove ads" }),
      onClick: () => setShowUserDialog(true),
    });

    return cards;
  }, [t, setShowUserDialog]);
}

/**
 * Our own promo, laid over an ad slot while NitroPay has no ad for it
 * (no-fill), and removed as soon as a refresh fills the slot. Each no-fill
 * picks the next card, so stacked slots show different ones.
 */
export function HouseAd({ id }: { id: string }): JSX.Element | null {
  const round = useAdBlankRound(id);
  if (!round) return null;
  return <HouseAdCard round={round} />;
}

function HouseAdCard({ round }: { round: number }): JSX.Element | null {
  const cards = useHouseCards();
  const ref = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    if (ref.current) {
      setBox({ w: ref.current.clientWidth, h: ref.current.clientHeight });
    }
  }, []);

  const card = cards[round % cards.length];
  if (!card) return null;

  // Rectangles and skyscrapers: painting on top, text on a fade below.
  // Banners: a wide painting made for the banner's ratio, subject on the
  // right, text over the dark left side.
  const row = !!box && box.h < 150;
  const ratio = box ? box.w / box.h : 1;
  const showBody = !row || (!!box && box.h >= 85);
  const showCta = !row || (!!box && box.h >= 85 && box.w >= 468);
  // Phone banners (320 wide): the text keeps to the left half, clear of the art.
  const narrow = row && !!box && box.w < 468;
  const art = `${ART_PATH}/${card.key}`;
  const content = (
    <Layout row={row}>
      {row ? (
        <>
          <img
            src={`${art}-${ratio >= 7 ? "8x1" : ratio >= 4.5 ? "6x1" : "3x1"}.webp`}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-right transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <div
            className={cn(
              "absolute inset-y-0 left-0 bg-linear-to-r from-card from-40% via-card/75 to-transparent",
              narrow ? "w-[80%]" : "w-[70%]",
            )}
          />
        </>
      ) : (
        <>
          <img
            src={`${art}.webp`}
            alt=""
            className="absolute inset-x-0 top-0 h-[78%] w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-x-0 bottom-0 h-[65%] bg-linear-to-t from-card from-45% via-card/80 to-transparent" />
        </>
      )}
      <div
        className={cn(
          "relative min-w-0",
          row
            ? cn("text-left", narrow ? "max-w-[56%]" : "max-w-[62%]")
            : "space-y-1",
        )}
      >
        <p
          className={cn(
            "font-semibold leading-tight [text-shadow:0_1px_4px_rgb(0_0_0/0.9)]",
            row
              ? narrow
                ? "line-clamp-2 text-[13px]"
                : "truncate text-sm"
              : "text-base",
          )}
        >
          {card.title}
        </p>
        {showBody && (
          <p
            className={cn(
              "text-muted-foreground leading-snug",
              row
                ? narrow
                  ? "line-clamp-2 text-[11px]"
                  : "line-clamp-2 text-xs"
                : "text-sm",
            )}
          >
            {card.body}
          </p>
        )}
        {showCta && (
          <p
            className={cn(
              "text-xs font-medium text-primary group-hover:underline",
              row ? "pt-0.5" : "pt-1.5",
            )}
          >
            {card.cta} →
          </p>
        )}
      </div>
    </Layout>
  );

  const className =
    "group absolute inset-0 z-1 block overflow-hidden rounded bg-card text-card-foreground";
  const style: CSSProperties = { cursor: "pointer" };
  const onClick = () => {
    trackEvent("House Ad: Click", { props: { card: card.key } });
    card.onClick?.();
  };

  return card.href ? (
    <a
      ref={ref as React.Ref<HTMLAnchorElement>}
      href={card.href}
      target="_blank"
      rel="noopener"
      className={className}
      style={style}
      onClick={onClick}
    >
      {content}
    </a>
  ) : (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      className={className}
      style={style}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      {content}
    </div>
  );
}

function Layout({ row, children }: { row: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center",
        row ? "px-3" : "flex-col justify-end p-4 text-center",
      )}
    >
      {children}
    </div>
  );
}

/**
 * An ad holder with the house-ad overlay. `className`/`style` size the
 * holder exactly like a bare `<div id={id}>` would.
 */
export function AdSlot({
  id,
  className,
  style,
}: {
  id: string;
  className?: string;
  style?: CSSProperties;
}): JSX.Element {
  return (
    <div className="relative shrink-0">
      <div id={id} className={className} style={style} />
      <HouseAd id={id} />
    </div>
  );
}
