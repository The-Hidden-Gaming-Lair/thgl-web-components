import { cn } from "@repo/lib";
import { GlobalMenu } from "./global-menu";
import { HTMLAttributes } from "react";

export function Header({
  children,
  activeApp,
  settingsDialogContent,
  ...props
}: {
  children: React.ReactNode;
  activeApp: string;
  settingsDialogContent?: JSX.Element;
} & HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <header
      className={cn(
        "px-2 h-[54px] z-[9990] fixed left-0 right-0 top-0 border-b bg-gradient-to-b backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 flex items-center md:pl-[77px]",
        props.className
      )}
      {...props}
    >
      <GlobalMenu
        activeApp={activeApp}
        settingsDialogContent={settingsDialogContent}
      />
      <nav
        className={cn("ml-2 grow flex items-center gap-2 text-sm font-bold")}
      >
        {children}
      </nav>
    </header>
  );
}
