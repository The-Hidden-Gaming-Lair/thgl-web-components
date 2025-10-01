import { getClosestActors } from "@repo/lib/overwolf";
import { Button } from "../(controls)";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function SendLogs() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    const closestActors = await getClosestActors([], 15);
    navigator.clipboard.writeText(JSON.stringify(closestActors));
    toast("Copied actors to clipboard");
    setIsLoading(false);
  };
  return (
    <Button onClick={handleClick} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
        </>
      ) : (
        "Debug Actors"
      )}
    </Button>
  );
}
