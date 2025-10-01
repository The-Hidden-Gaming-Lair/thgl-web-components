import { DrawingsAndNodes, useSettingsStore, useUserStore } from "@repo/lib";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

export function DeleteFilter({
  myFilter,
  onClose,
}: {
  myFilter: DrawingsAndNodes | null;
  onClose: () => void;
}) {
  const removeMyFilter = useSettingsStore((state) => state.removeMyFilter);
  const filters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);

  const handleDelete = async () => {
    if (!myFilter) {
      return;
    }
    removeMyFilter(myFilter.name);
    onClose();
    const newFilters = filters.filter((f) => f !== myFilter.name);
    setFilters(newFilters);
  };

  return (
    <AlertDialog
      open={!!myFilter}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {myFilter?.name.replace(/my_\d+_/, "")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            filter.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
