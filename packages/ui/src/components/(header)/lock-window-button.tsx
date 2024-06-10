import { EyeNoneIcon } from "@radix-ui/react-icons";
import { Button } from "../ui/button";
import { useSettingsStore } from "@repo/lib";

export function LockWindowButton() {
  const toggleLockedWindow = useSettingsStore(
    (state) => state.toggleLockedWindow,
  );

  return (
    <Button onClick={toggleLockedWindow}>
      <EyeNoneIcon />
      <span className="ml-1 hidden lg:block">Hide Controls</span>
    </Button>
  );
}
