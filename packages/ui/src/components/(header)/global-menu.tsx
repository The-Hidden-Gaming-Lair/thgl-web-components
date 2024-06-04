"use client";
import { ChevronRightIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";
import { cn } from "@repo/lib";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Info, Settings } from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { ExternalAnchor } from "./external-anchor";
import { Dialog, DialogTrigger } from "../ui/dialog";
import { useT } from "../(providers)";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { User } from "./user";
import ConsentLink from "../(ads)/consent-link";

const APPS = [
  {
    title: "Wuthering Waves",
    url: "https://wuthering.th.gl",
    icon: "/global_icons/wuthering-waves.webp",
    tags: ["interactive_map"],
  },
  {
    title: "Pax Dei",
    url: "https://paxdei.th.gl",
    icon: "/global_icons/pax-dei.webp",
    tags: ["interactive_map"],
    partners: [
      {
        title: "Pax Dei Database",
        url: "https://paxdei.gaming.tools?ref=thgl",
        icon: "/global_icons/gaming-tools.webp",
      },
    ],
  },
  {
    title: "Seekers of Skyveil",
    url: "https://seekers.th.gl",
    icon: "/global_icons/seekers-of-skyveil.webp",
    tags: ["interactive_map"],
    partners: [
      {
        title: "Seekers Database",
        url: "https://seekers.gaming.tools?ref=thgl",
        icon: "/global_icons/gaming-tools.webp",
      },
    ],
  },
  {
    title: "Night Crows",
    url: "https://nightcrows.th.gl",
    icon: "/global_icons/night-crows.webp",
    tags: ["interactive_map"],
    partners: [
      {
        title: "Night Crows Database",
        url: "https://nightcrows.gaming.tools?ref=thgl",
        icon: "/global_icons/gaming-tools.webp",
      },
    ],
  },
  {
    title: "Nightingale",
    url: "https://nightingale.th.gl",
    icon: "/global_icons/nightingale.webp",
    tags: ["interactive_map"],
    partners: [
      {
        title: "Nightingale Database",
        url: "https://nightingale.gaming.tools/en?ref=thgl",
        icon: "/global_icons/gaming-tools.webp",
      },
      {
        title: "Nightingale Guides",
        url: "https://www.studioloot.com/nightingale",
        icon: "/global_icons/studio-loot.webp",
      },
    ],
  },
  {
    title: "New World Map",
    url: "https://aeternum-map.th.gl",
    icon: "/global_icons/aeternum-map.png",
    tags: ["interactive_map"],
  },
  {
    title: "New World Tracker",
    url: "https://aeternum-tracker.th.gl",
    icon: "/global_icons/aeternum-tracker.webp",
    tags: ["activity_tracker"],
  },
  {
    title: "Diablo IV",
    url: "https://diablo4.th.gl",
    icon: "/global_icons/diablo4.webp",
    tags: ["interactive_map"],
    partners: [
      {
        title: "D4 Armory",
        url: "https://d4armory.io/?ref=thgl",
        icon: "/global_icons/d4armory.webp",
      },
      {
        title: "Diablo IV Companion",
        url: "https://github.com/josdemmers/Diablo4Companion?ref=thgl",
        icon: "/global_icons/diablo4companion.webp",
      },
    ],
  },
  {
    title: "Hogwarts Legacy",
    url: "https://hogwarts.th.gl",
    icon: "/global_icons/hogwarts-legacy.webp",
    tags: ["interactive_map"],
  },
  {
    title: "League of Legends",
    url: "https://lol.th.gl",
    icon: "/global_icons/league-of-legends.webp",
    tags: ["challenges"],
  },
  {
    title: "Lost Ark",
    url: "https://arkesia.th.gl",
    icon: "/global_icons/lost-ark.webp",
    tags: ["interactive_map"],
  },
  {
    title: "Once Human",
    url: "https://oncehuman.th.gl",
    icon: "/global_icons/once-human.webp",
    tags: ["interactive_map"],
  },
  {
    title: "Palia",
    url: "https://palia.th.gl",
    icon: "/global_icons/palia.webp",
    tags: ["interactive_map", "leaderboard"],
  },
  {
    title: "Palworld",
    url: "https://palworld.th.gl",
    icon: "/global_icons/palworld.webp",
    tags: ["interactive_map"],
    partners: [
      {
        title: "/r/Palworld",
        url: "https://www.reddit.com/r/palworld",
        icon: "/global_icons/reddit.webp",
      },
      {
        title: "The Palworld Wiki",
        url: "https://palworld.wiki.gg",
        icon: "/global_icons/wiki-gg.webp",
      },
      {
        title: "Palworld Database",
        url: "https://gaming.tools/palworld/en?ref=thgl",
        icon: "/global_icons/palworld_db.webp",
      },
      {
        title: "Palworld Server Hosting",
        url: "https://billing.skynode.pro/aff.php?aff=1043",
        icon: "/global_icons/skynode.webp",
      },
    ],
  },
  {
    title: "Songs of Conquest",
    url: "https://soc.th.gl",
    icon: "/global_icons/songs-of-conquest.webp",
    tags: ["database"],
  },
  {
    title: "Sons of the Forest",
    url: "https://sotf.th.gl",
    icon: "/global_icons/sons-of-the-forest.webp",
    tags: ["interactive_map"],
  },
];

export function GlobalMenu({
  activeApp,
  settingsDialogContent,
}: {
  activeApp: string;
  settingsDialogContent?: JSX.Element;
}): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useT();

  const sortedApps = useMemo(
    () =>
      APPS.sort((a, b) => {
        if (a.title === activeApp) {
          return -1;
        }
        if (b.title === activeApp) {
          return 1;
        }
        return a.title.localeCompare(b.title);
      }),
    [activeApp]
  );

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isExpanded]);
  return (
    <>
      <Button
        className="md:hidden shrink-0"
        onClick={() => {
          setIsExpanded(true);
        }}
        size="icon"
        variant="outline"
      >
        <HamburgerMenuIcon />
      </Button>
      <aside
        className={cn(
          "fixed h-dvh z-[10010] bg-background px-4 py-2 shadow-lg inset-y-0 left-0 border-r sm:max-w-sm flex-col gap-3 hidden md:flex",
          {
            "w-fit flex": isExpanded,
          }
        )}
      >
        <Button
          className={cn("mx-1", {
            "w-full": isExpanded,
          })}
          onClick={() => {
            setIsExpanded(!isExpanded);
          }}
          size={isExpanded ? "default" : "icon"}
          variant="outline"
        >
          <ChevronRightIcon
            className={cn("h-4 w-4 transition-transform", {
              "transform rotate-180": isExpanded,
            })}
          />
          <span
            className={cn("ml-2", {
              hidden: !isExpanded,
            })}
          >
            Close
          </span>
        </Button>
        <ExternalAnchor
          className="flex items-center gap-2 text-lg md:text-2xl md:leading-6 font-extrabold tracking-tight whitespace-nowrap"
          href="https://www.th.gl"
          title="The Hidden Gaming Lair"
        >
          <img alt="" className="w-11 h-11" src="/global_icons/thgl.png" />
          <span
            className={cn({
              hidden: !isExpanded,
            })}
          >
            TH.GL
          </span>
        </ExternalAnchor>
        <ScrollArea className="grow">
          <div className="flex flex-col gap-3 mx-1">
            {sortedApps.map((app) => (
              <Fragment key={app.title}>
                <ExternalAnchor
                  className={cn(
                    "group outline-none flex items-center gap-2 text-md font-medium text-secondary-foreground/50 transition-colors",
                    app.title === activeApp
                      ? "text-primary"
                      : "hover:text-secondary-foreground"
                  )}
                  href={app.url}
                >
                  <img
                    alt=""
                    className={cn(
                      "bg-background h-9 w-9 border-2 border-secondary rounded-full overflow-hidden transition-colors group-focus-visible:outline-none group-focus-visible:ring-1 group-focus-visible:ring-ring",
                      app.title === activeApp
                        ? "border-primary"
                        : "group-hover:border-white/50"
                    )}
                    src={app.icon}
                    title={app.title}
                  />
                  <p
                    className={cn({
                      hidden: !isExpanded,
                    })}
                  >
                    <span className="block text-sm">{app.title}</span>
                    <span className="block text-secondary-foreground/30 group-hover:text-secondary-foreground/50 transition-colors text-xs">
                      {app.tags.map((tag) => t(tag)).join(", ")}
                    </span>
                  </p>
                </ExternalAnchor>
                {app.title === activeApp &&
                  app.partners?.map((partner) => (
                    <ExternalAnchor
                      key={partner.title}
                      className={cn(
                        "group outline-none flex items-center gap-2 text-md font-medium text-secondary-foreground/50 transition-colors hover:text-secondary-foreground"
                      )}
                      href={partner.url}
                    >
                      <img
                        alt=""
                        className={cn(
                          "bg-background mx-1 h-7 w-7 border-2 border-secondary rounded-full overflow-hidden transition-colors group-focus-visible:outline-none group-focus-visible:ring-1 group-focus-visible:ring-ring group-hover:border-white/50"
                        )}
                        src={partner.icon}
                        title={partner.title}
                      />
                      <p
                        className={cn({
                          hidden: !isExpanded,
                        })}
                      >
                        <span className="block text-xs">{partner.title}</span>
                      </p>
                    </ExternalAnchor>
                  ))}
              </Fragment>
            ))}
          </div>
        </ScrollArea>
        <div className="flex flex-col gap-3 mx-1">
          <Button
            asChild
            className="bg-[#6974f3]/70 hover:bg-[#6974f3]"
            size={isExpanded ? "default" : "icon"}
            title="Discord"
            variant="secondary"
          >
            <ExternalAnchor href="https://th.gl/discord">
              <svg
                fill="currentColor"
                height="20"
                viewBox="0 0 16 16"
                width="20"
              >
                <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z" />
              </svg>
              <span
                className={cn("ml-2", {
                  hidden: !isExpanded,
                })}
              >
                Discord
              </span>
            </ExternalAnchor>
          </Button>
          {settingsDialogContent && (
            <Dialog>
              <Button
                asChild
                size={isExpanded ? "default" : "icon"}
                title={t("settings")}
                variant="secondary"
              >
                <DialogTrigger>
                  <Settings />
                  <span
                    className={cn("ml-2", {
                      hidden: !isExpanded,
                    })}
                  >
                    {t("settings")}
                  </span>
                </DialogTrigger>
              </Button>
              {settingsDialogContent}
            </Dialog>
          )}
          <User isExpanded={isExpanded} />
          <HoverCard openDelay={50} closeDelay={50}>
            <HoverCardTrigger asChild>
              <Button
                size={isExpanded ? "default" : "icon"}
                title={t("about")}
                variant="secondary"
              >
                <Info />
                <span
                  className={cn("ml-2", {
                    hidden: !isExpanded,
                  })}
                >
                  {t("about")}
                </span>
              </Button>
            </HoverCardTrigger>
            <HoverCardContent side="right" className="w-fit flex flex-col">
              <Button asChild variant="link">
                <ExternalAnchor href="https://www.th.gl/legal-notice">
                  {t("legal_notice")}
                </ExternalAnchor>
              </Button>
              <Button asChild variant="link">
                <ExternalAnchor href="https://www.th.gl/privacy-policy">
                  {t("privacy_policy")}
                </ExternalAnchor>
              </Button>
              <ConsentLink />
            </HoverCardContent>
          </HoverCard>
        </div>
      </aside>
      <div
        aria-hidden="true"
        className={cn("fixed h-dvh inset-0 z-[10009]", {
          "bg-black/80 animate-in fade-in-0": isExpanded,
          "pointer-events-none animate-out fade-out-0": !isExpanded,
        })}
        onClick={() => {
          setIsExpanded(false);
        }}
        onKeyDown={(event) => event.key === "Escape" && setIsExpanded(false)}
      />
    </>
  );
}
