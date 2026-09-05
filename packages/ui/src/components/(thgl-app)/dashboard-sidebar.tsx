"use client";

import {
  cn,
  games,
  hasReleasedCompanion,
  localizePath,
  useAccountStore,
} from "@repo/lib";
import {
  openInBrowser,
  useLiveState,
  useTHGLAppState,
} from "@repo/lib/thgl-app";
import { Button } from "../(controls)";
import {
  ChevronLeft,
  ChevronRight,
  CircleUser,
  Home,
  Settings,
  Circle,
  Globe,
  HelpCircle,
  Lightbulb,
  BookOpen,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../(controls)";
import { useLocale, useT } from "../(providers)";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ScrollArea } from "../ui/scroll-area";

export function DashboardSidebar() {
  const isExpanded = useTHGLAppState((state) => state.sidebarExpanded);
  const setIsExpanded = useTHGLAppState((state) => state.setSidebarExpanded);
  const account = useAccountStore();
  const pathname = usePathname();
  const locale = useLocale();
  const runningGames = useLiveState((state) => state.runningGames);
  const t = useT();

  // Separate companion games and web-only games. `inDevelopment` companions are hidden from the
  // app entirely until launch — excluded here AND kept out of the web-only list (they have a
  // companion block, so `!game.companion` already excludes them). Preview-release games are NOT
  // inDevelopment — they appear here, gated to Elite supporters via PreviewReleaseGuard.
  const companionGames = games.filter(hasReleasedCompanion);
  const webOnlyGames = games.filter((game) => !game.companion && game.web);

  const isGameRunning = (gameId: string) => {
    const game = games.find((g) => g.id === gameId);
    if (!game?.companion?.games) return false;

    const processNames = game.companion.games.flatMap((g) =>
      g.processNames.map((p) => p.toLowerCase()),
    );

    return runningGames?.some((rg) =>
      processNames.includes(rg.processName.toLowerCase()),
    );
  };

  return (
    <aside
      className={cn(
        "h-full shrink-0 border-r bg-card flex flex-col transition-all duration-300",
        isExpanded ? "w-[220px]" : "w-[60px]",
      )}
    >
      {/* Toggle Button */}
      <div className="p-2 border-b">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          size={isExpanded ? "sm" : "icon"}
          variant="outline"
          className={cn(
            "w-full",
            isExpanded ? "justify-start" : "justify-center",
          )}
          aria-label={isExpanded ? t("sidebar.collapse") : "Expand sidebar"}
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform", {
              "rotate-180": !isExpanded,
            })}
          />
          {isExpanded && (
            <span className="ml-2 text-xs">{t("sidebar.collapse")}</span>
          )}
        </Button>
      </div>

      {/* Home Link */}
      <div className="p-2 border-b">
        <NavItem
          href={localizePath("/dashboard", locale)}
          icon={<Home className="h-4 w-4" />}
          label={t("sidebar.home")}
          isActive={pathname === localizePath("/dashboard", locale)}
          isExpanded={isExpanded}
        />
      </div>

      {/* External Links */}
      <div className="p-2 border-b space-y-1">
        {isExpanded && (
          <span className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("sidebar.resources")}
          </span>
        )}
        <ExternalNavItem
          url="https://www.th.gl/faq"
          icon={<HelpCircle className="h-4 w-4" />}
          label={t("sidebar.faq")}
          isExpanded={isExpanded}
        />
        <ExternalNavItem
          url="https://www.th.gl/suggestions-issues"
          icon={<Lightbulb className="h-4 w-4" />}
          label={t("sidebar.suggestions")}
          isExpanded={isExpanded}
        />
        <ExternalNavItem
          url="https://www.th.gl/blog"
          icon={<BookOpen className="h-4 w-4" />}
          label={t("sidebar.blog")}
          isExpanded={isExpanded}
        />
        <ExternalNavItem
          url="https://th.gl/discord"
          icon={<MessageCircle className="h-4 w-4" />}
          label={t("sidebar.discord")}
          isExpanded={isExpanded}
        />
      </div>

      {/* Games List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isExpanded && (
            <span className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("sidebar.games")}
            </span>
          )}
          {companionGames.map((game) => {
            const gameHref = localizePath(
              `/dashboard/games/${game.id}`,
              locale,
            );
            const isActive = pathname === gameHref;
            const isRunning = isGameRunning(game.id);

            return (
              <NavItem
                key={game.id}
                href={gameHref}
                icon={
                  <div className="relative">
                    <Image
                      src={game.logo}
                      unoptimized
                      alt={game.title}
                      width={20}
                      height={20}
                      className="rounded"
                    />
                    {isRunning && (
                      <Circle className="absolute -bottom-0.5 -right-0.5 h-2 w-2 fill-green-500 text-green-500" />
                    )}
                  </div>
                }
                label={game.title}
                isActive={isActive}
                isExpanded={isExpanded}
              />
            );
          })}

          {/* Web-Only Games */}
          {webOnlyGames.length > 0 && (
            <>
              {isExpanded && (
                <span className="px-2 pt-3 text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                  {t("sidebar.webOnly")}
                </span>
              )}
              {webOnlyGames.map((game) => {
                const gameHref = localizePath(
                  `/dashboard/games/${game.id}`,
                  locale,
                );
                const isActive = pathname === gameHref;

                return (
                  <NavItem
                    key={game.id}
                    href={gameHref}
                    icon={
                      <div className="relative">
                        <Image
                          src={game.logo}
                          unoptimized
                          alt={game.title}
                          width={20}
                          height={20}
                          className="rounded opacity-70"
                        />
                        <Globe className="absolute -bottom-0.5 -right-0.5 h-2 w-2 text-muted-foreground" />
                      </div>
                    }
                    label={game.title}
                    isActive={isActive}
                    isExpanded={isExpanded}
                  />
                );
              })}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Bottom Actions */}
      <div className="p-2 border-t space-y-1">
        <NavItem
          href={localizePath("/dashboard/settings", locale)}
          icon={<Settings className="h-4 w-4" />}
          label={t("sidebar.settings")}
          isActive={pathname === localizePath("/dashboard/settings", locale)}
          isExpanded={isExpanded}
        />
        {isExpanded ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => account.setShowUserDialog(true)}
          >
            <CircleUser
              className={cn("h-4 w-4 mr-2", account.userId && "text-primary")}
            />
            <span className="truncate text-xs">
              {account?.decryptedUserId
                ? account.decryptedUserId
                : t("sidebar.signIn")}
            </span>
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                onClick={() => account.setShowUserDialog(true)}
              >
                <CircleUser
                  className={cn("h-4 w-4", account.userId && "text-primary")}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>
                {account?.decryptedUserId
                  ? account.decryptedUserId
                  : t("sidebar.signIn")}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
        {isExpanded && (
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 px-2 pt-1 text-[10px] text-muted-foreground">
            <button
              className="hover:text-foreground transition-colors"
              onClick={() => openInBrowser("https://www.th.gl/legal-notice")}
            >
              Legal Notice
            </button>
            <button
              className="hover:text-foreground transition-colors"
              onClick={() => openInBrowser("https://www.th.gl/privacy-policy")}
            >
              Privacy Policy
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavItem({
  href,
  icon,
  label,
  isActive,
  isExpanded,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isExpanded: boolean;
}) {
  const button = (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "w-full transition-colors hover:bg-primary/10 hover:text-primary",
        isExpanded ? "justify-start" : "justify-center",
        isActive && "bg-primary/10 text-primary",
      )}
      asChild
    >
      {/* prefetch disabled: the sidebar renders 20+ always-visible game
          links inside a long-lived WebView2 and re-renders on every
          running-games poll. Default prefetching re-fetched every link's
          RSC payload per staleness window — and retried failed prefetches
          on every re-render without backoff, which kept one rate-limited
          client hammering the origin at ~26 req/s indefinitely. */}
      <Link href={href} prefetch={false}>
        <span className={cn(isExpanded && "mr-2")}>{icon}</span>
        {isExpanded && <span className="text-sm truncate">{label}</span>}
      </Link>
    </Button>
  );

  if (!isExpanded) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}

function ExternalNavItem({
  url,
  icon,
  label,
  isExpanded,
}: {
  url: string;
  icon: React.ReactNode;
  label: string;
  isExpanded: boolean;
}) {
  const button = (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "w-full transition-colors hover:bg-primary/10 hover:text-primary",
        isExpanded ? "justify-start" : "justify-center",
      )}
      onClick={() => openInBrowser(url)}
    >
      <span className={cn(isExpanded && "mr-2")}>{icon}</span>
      {isExpanded && (
        <>
          <span className="text-sm truncate flex-1 text-left">{label}</span>
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </>
      )}
    </Button>
  );

  if (!isExpanded) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
