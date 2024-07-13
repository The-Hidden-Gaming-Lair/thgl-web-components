import { getClosestActors, promisifyOverwolf } from "@repo/lib/overwolf";
import { Button } from "../(controls)";
import { useState } from "react";
import { toast } from "sonner";
import { useGameState } from "@repo/lib";
import { Loader2 } from "lucide-react";

export function SendLogs() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const gameState = useGameState.getState();
      console.log("Player:");
      console.log(JSON.stringify(gameState.player));

      if (getClosestActors) {
        const closestActors = await getClosestActors([], 100);
        console.log("Closest actors:");
        console.log(JSON.stringify(closestActors));
      } else {
        console.error("getClosestActors not available");
      }
      const result = await promisifyOverwolf(overwolf.utils.uploadClientLogs)();
      if (!result.success) {
        throw new Error("Failed to send logs");
      }
      toast("Logs sent!");
    } catch (e) {
      console.error(e);
      toast("Failed to send logs");
    }
    setIsLoading(false);
  };
  return (
    <Button onClick={handleClick} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
        </>
      ) : (
        "Send Logs"
      )}
    </Button>
  );
}
