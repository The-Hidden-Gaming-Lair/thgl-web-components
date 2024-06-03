import { useEffect } from "react";
import { toast } from "sonner";
import { ExternalAnchor } from "../(header)";
import { useGameState } from "@repo/lib";

export function Status() {
  const error = useGameState((state) => state.error);

  useEffect(() => {
    if (error && typeof error === "string") {
      if (
        error.includes("Access is denied") ||
        error.includes("Accès refusé")
      ) {
        const toastId = toast.error("Access is denied", {
          duration: Infinity,
          important: true,
          closeButton: true,
          description: (
            <>
              Please do not run the game as administrator! If this is not
              possible, run the app with admin privileges. Join the{" "}
              <ExternalAnchor
                className="text-primary"
                href="https://th.gl/discord"
              >
                Discord server
              </ExternalAnchor>{" "}
              for support.
            </>
          ),
        });
        return () => {
          toast.dismiss(toastId);
        };
      }
    }
  }, [error]);

  return <></>;
}
