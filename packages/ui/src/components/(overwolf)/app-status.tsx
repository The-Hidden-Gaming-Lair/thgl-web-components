import { useEffect, useState } from "react";
import { Button } from "../(controls)";
import { ExternalLink, TriangleAlert } from "lucide-react";
import { useGameState } from "@repo/lib";
import { ScrollArea } from "../ui/scroll-area";
import { ExternalAnchor } from "../(header)";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
} from "../ui/dialog";

export function AppStatus({ gameClassId }: { gameClassId: number }) {
  const [isOverlayEnabled, setIsOverlayEnabled] = useState(true);
  const error = useGameState((state) => state.error) ?? "";

  useEffect(() => {
    overwolf.settings.games.getOverlayEnabled(gameClassId, (event) =>
      setIsOverlayEnabled(event.enabled),
    );

    const handleOverlayEnablementChanged = (
      event: overwolf.settings.games.OverlayEnablementChangedEvent,
    ) => {
      if (event.gameId === gameClassId) {
        setIsOverlayEnabled(event.enabled);
      }
    };

    overwolf.settings.games.onOverlayEnablementChanged.addListener(
      handleOverlayEnablementChanged,
    );

    return () => {
      overwolf.settings.games.onOverlayEnablementChanged.removeListener(
        handleOverlayEnablementChanged,
      );
    };
  }, []);

  const hasAdminError =
    error === "Please run as administrator" ||
    error.includes("Access is denied") ||
    error.includes("Accès refusé");

  if (isOverlayEnabled && !hasAdminError) {
    return null;
  }

  return (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <TriangleAlert className="mr-2 h-4 w-4" /> Action Required
        </Button>
      </DialogTrigger>
      <DialogContent>
        <ScrollArea className="max-h-[65vh]">
          {!isOverlayEnabled && (
            <>
              <DialogHeader>Overlay Support Disabled</DialogHeader>
              <DialogDescription className="space-y-1">
                <p>
                  The app requires the game overlay to be enabled to function
                  properly. Please enable the game overlay support in the
                  Overwolf Game settings.
                </p>
                <Button asChild size="sm">
                  <a href="overwolf://settings">Open Overwolf Game settings</a>
                </Button>
                <p>
                  <ExternalAnchor
                    href="https://support.overwolf.com/en/support/solutions/articles/9000178795-overwolf-game-settings"
                    className="inline-flex gap-1 text-primary hover:underline"
                  >
                    <span>Read more</span>
                    <ExternalLink className="w-3 h-3" />
                  </ExternalAnchor>{" "}
                  for a detailed guide and more information about Overwolf's
                  Game Settings.
                </p>
              </DialogDescription>
            </>
          )}
          {hasAdminError && (
            <>
              <DialogHeader>Missing Permissions</DialogHeader>
              <DialogDescription className="space-y-1">
                <p>
                  This app requires administrator rights and needs to be running
                  on game start to function properly. Exit Overwolf, then run it
                  as an administrator{" "}
                  <span className="font-bold">before starting the game</span>.
                </p>
                <ul className="mb-4 list-disc list-inside">
                  <li>
                    <span className="font-bold">Exit Overwolf:</span>{" "}
                    Right-click on the system tray icon and select{" "}
                    <span className="italic">"Exit Overwolf"</span>.
                    <img
                      src="/global_icons/guide/exit.webp"
                      alt="Exit Overwolf"
                      height={96}
                      width={270}
                    />
                  </li>
                  <li>
                    <span className="font-bold">Properties Method:</span>{" "}
                    Right-click the Overwolf shortcut, select{" "}
                    <span className="italic">"Properties"</span>, go to the{" "}
                    <span className="italic">"Compatibility"</span> tab, and
                    check the box labeled{" "}
                    <span className="italic">
                      "Run this program as an administrator"
                    </span>
                    . Click <span className="italic">"Apply"</span> and then{" "}
                    <span className="italic">"OK"</span>.
                  </li>
                  <li>
                    <span className="font-bold">Right-click Method:</span>{" "}
                    Locate the Overwolf shortcut or executable file, right-click
                    on it, and select{" "}
                    <span className="italic">"Run as administrator"</span>.
                  </li>
                </ul>
              </DialogDescription>
            </>
          )}
          <DialogDescription>
            <span className="font-bold">Need Help?</span> If you have any
            questions or need assistance, feel free to join my Discord server
            and check the FAQ and support channels:
            <ExternalAnchor
              href="https://www.th.gl/discord"
              className="flex gap-1 text-primary hover:underline"
            >
              <span>Join my Discord server</span>
              <ExternalLink className="w-3 h-3" />
            </ExternalAnchor>
            <p className="text-secondary-foreground">
              Thank you for your understanding and support! 🙏
            </p>
          </DialogDescription>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
