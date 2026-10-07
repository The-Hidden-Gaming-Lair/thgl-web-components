"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
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
import { ExternalLink, Gamepad2, HeartHandshake } from "lucide-react";
import { useT } from "../(providers)";
import { DiscordIcon } from "../(header)/social-icons";
import { trackEvent } from "../(header)/plausible-tracker";
import globalMenu from "../(header)/global-menu.json";
import { useAdBlankRound } from "./ad-fill";

type HouseCard = {
  key: "companion" | "partner" | "discord" | "adfree";
  Icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  cta: string;
  href?: string;
  onClick?: () => void;
};

const DISCORD_URL = "https://th.gl/discord";

function DiscordGlyph({ className }: { className?: string }) {
  return <DiscordIcon size={24} className={className} />;
}

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
        Icon: Gamepad2,
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
        Icon: ExternalLink,
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
      Icon: DiscordGlyph,
      title: t("houseAd.discord.title", { fallback: "Join the THGL Discord" }),
      body: t("houseAd.discord.body", {
        fallback: "Map updates, feedback and help from the community.",
      }),
      cta: t("houseAd.discord.cta", { fallback: "Join Discord" }),
      href: DISCORD_URL,
    });

    cards.push({
      key: "adfree",
      Icon: HeartHandshake,
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

  // 728x90 / 320x100 / 320x50 lay out in a row; rectangles and
  // skyscrapers stack.
  const row = !!box && box.h < 150;
  const showBody = !box || !row || box.h >= 85;
  const showCta = !box || !row || box.w >= 468;
  const content = (
    <Layout row={row}>
      <card.Icon
        className={cn("shrink-0 text-primary", row ? "h-6 w-6" : "h-10 w-10")}
      />
      <div className={cn("min-w-0", row ? "flex-1 text-left" : "space-y-1")}>
        <p
          className={cn(
            "font-semibold leading-tight",
            row ? "truncate text-sm" : "text-base",
          )}
        >
          {card.title}
        </p>
        {showBody && (
          <p
            className={cn(
              "text-muted-foreground leading-snug",
              row ? "line-clamp-2 text-xs" : "text-sm",
            )}
          >
            {card.body}
          </p>
        )}
      </div>
      {showCta && (
        <span className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
          {card.cta}
        </span>
      )}
    </Layout>
  );

  const className =
    "absolute inset-0 z-1 block overflow-hidden rounded bg-card text-card-foreground bg-linear-to-br from-primary/15 to-transparent transition-colors hover:from-primary/25";
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
        row ? "gap-3 px-3" : "flex-col justify-center gap-3 p-4 text-center",
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
