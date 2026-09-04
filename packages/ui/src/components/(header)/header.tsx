import { cn } from "@repo/lib";
import { HTMLAttributes, type JSX } from "react";
import { FilterDetectionWarning } from "../(ads)";
import { GameSwitcher } from "./game-switcher";
import { Settings } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogTrigger } from "../ui/dialog";
import { User } from "./user";
import { NewVersionButton } from "./new-version-button";

export function Header({
  children,
  activeApp,
  settingsDialogContent,
  settingsTitle,
  ...props
}: {
  children: React.ReactNode;
  activeApp: string;
  settingsDialogContent?: JSX.Element;
  settingsTitle: string;
} & HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <header
      className={cn(
        "px-2 h-[54px] z-99990 fixed left-0 right-0 top-0 border-b bg-linear-to-b backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 flex items-center select-none",
        props.className,
      )}
      {...props}
    >
      {/* Game switcher — all screen sizes */}
      <GameSwitcher activeApp={activeApp} />

      {/* Navigation content (Brand, Links, Account) */}
      <nav className="ml-2 grow flex items-center gap-2 text-sm font-bold min-w-0">
        {children}
      </nav>

      {/* Action buttons — all screen sizes */}
      <div className="flex items-center gap-1 ml-2 shrink-0">
        {/* Renders nothing unless a newer build is deployed. */}
        <NewVersionButton />
        {settingsDialogContent && (
          <Dialog>
            <Button asChild size="icon" title={settingsTitle} variant="outline">
              <DialogTrigger>
                <Settings className="h-4 w-4" />
              </DialogTrigger>
            </Button>
            {settingsDialogContent}
          </Dialog>
        )}
        <User isExpanded={false} />
      </div>

      <FilterDetectionWarning />
    </header>
  );
}
