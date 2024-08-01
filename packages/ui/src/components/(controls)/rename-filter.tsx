import { Button, Label } from "../(controls)";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useState } from "react";
import { Input } from "../ui/input";
import { type MyFilter, useSettingsStore } from "@repo/lib";
import { useUserStore } from "../(providers)";

export function RenameFilter({
  myFilter,
  onClose,
}: {
  myFilter: MyFilter | null;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const addMyFilter = useSettingsStore((state) => state.addMyFilter);
  const removeMyFilter = useSettingsStore((state) => state.removeMyFilter);
  const filters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    if (!myFilter) {
      return;
    }
    event.preventDefault();
    removeMyFilter(myFilter.name);
    const filterName = `my_${Date.now()}_${name}`;
    addMyFilter({ ...myFilter, name: filterName });
    onClose();
    const wasActive = filters.includes(myFilter.name);
    const newFilters = filters.filter((f) => f !== myFilter.name);
    if (wasActive) {
      newFilters.push(filterName);
    }
    setFilters(newFilters);
  };

  return (
    <Dialog
      open={!!myFilter}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Rename {myFilter?.name.replace(/my_\d+_/, "")}
          </DialogTitle>
        </DialogHeader>
        <section className="space-y-4 overflow-hidden">
          <form className="space-y-2" onSubmit={handleSubmit}>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="Enter new name"
              />
            </div>
            <Button type="submit" disabled={!name} className="w-full">
              Rename Filter
            </Button>
          </form>
        </section>
      </DialogContent>
    </Dialog>
  );
}
