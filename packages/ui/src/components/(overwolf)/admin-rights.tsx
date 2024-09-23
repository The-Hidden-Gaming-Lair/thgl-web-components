import { ExternalLink } from "lucide-react";
import { ExternalAnchor } from "../(header)";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useGameState } from "@repo/lib";
import { Button } from "../(controls)";
import { closeMainWindow } from "@repo/lib/overwolf";
import { ScrollArea } from "../ui/scroll-area";

export function AdminRights() {
  const error = useGameState((state) => state.error) ?? "";
  const open =
    error === "Please run as administrator" ||
    error.includes("Access is denied") ||
    error.includes("Accès refusé");

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>⚠️ Missing Permissions</AlertDialogTitle>
        </AlertDialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <p>
            This app requires administrator rights and needs to be running on
            game start to function properly. Exit Overwolf, then run it as an
            administrator{" "}
            <span className="font-bold">before starting the game</span>.
          </p>
          <ul className="mb-4 list-disc list-inside">
            <li>
              <span className="font-bold">Exit Overwolf:</span> Right-click on
              the system tray icon and select{" "}
              <span className="italic">"Exit Overwolf"</span>.
              <img
                src="/global_icons/guide/exit.webp"
                alt="Exit Overwolf"
                height={96}
                width={270}
              />
            </li>
            <li>
              <span className="font-bold">Properties Method:</span> Right-click
              the Overwolf shortcut, select{" "}
              <span className="italic">"Properties"</span>, go to the{" "}
              <span className="italic">"Compatibility"</span> tab, and check the
              box labeled{" "}
              <span className="italic">
                "Run this program as an administrator"
              </span>
              . Click <span className="italic">"Apply"</span> and then{" "}
              <span className="italic">"OK"</span>.
            </li>
            <li>
              <span className="font-bold">Right-click Method:</span> Locate the
              Overwolf shortcut or executable file, right-click on it, and
              select <span className="italic">"Run as administrator"</span>.
            </li>
            <li>
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
            </li>
          </ul>
          <p className="text-secondary-foreground">
            Thank you for your understanding and support! 🙏
          </p>
        </ScrollArea>
        <Button onClick={() => closeMainWindow()}>Close App</Button>
      </AlertDialogContent>
    </AlertDialog>
  );
}
