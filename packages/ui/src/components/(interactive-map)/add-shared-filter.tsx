import { Users } from "lucide-react";
import { Button, Label } from "../(controls)";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useState } from "react";
import { Input } from "../ui/input";
import { ReloadIcon } from "@radix-ui/react-icons";
import {
  getSharedFilterByCode,
  type DrawingsAndNodes,
  useSettingsStore,
  useUserStore,
} from "@repo/lib";
import { toast } from "sonner";

export function AddSharedFilter() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [shareCode, setShareCode] = useState("");
  const addMyFilter = useSettingsStore((state) => state.addMyFilter);
  const [open, setOpen] = useState(false);
  const filters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const blob = await getSharedFilterByCode(shareCode);
      const response = await fetch(blob.url);
      const data = (await response.json()) as DrawingsAndNodes;
      addMyFilter({ ...data, url: blob.url });
      toast.success("Shared filter added successfully");
      setFilters([...filters.filter((f) => f !== data.name), data.name]);

      setOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unknown error occurred");
      }
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          type="button"
          variant="secondary"
          onClick={async () => {}}
        >
          <Users className="h-4 w-4 mr-2" />
          Add Shared Filter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Shared Filter</DialogTitle>
          <DialogDescription>
            The code for the shared filters is available in menu next to the
            filter. Other users can import the filters including all nodes and
            drawings by entering the code.
          </DialogDescription>
        </DialogHeader>
        <section className="space-y-4 overflow-hidden">
          <p className="text-orange-500 truncate">{errorMessage}</p>
          <form className="space-y-2" onSubmit={handleSubmit}>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="shareCode">Share Code</Label>
              <Input
                id="shareCode"
                type="text"
                value={shareCode}
                onChange={(event) => setShareCode(event.target.value)}
                required
                placeholder="Enter the code"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !shareCode}
              className="w-full"
            >
              {isLoading && (
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Shared Filter
            </Button>
          </form>
        </section>
      </DialogContent>
    </Dialog>
  );
}
