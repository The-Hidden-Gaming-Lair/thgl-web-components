import { useEffect, useState } from "react";
import { Button } from "../ui/button";

export function Hotkey({
  name,
  gameClassId,
}: {
  name: string;
  gameClassId: number;
}) {
  const [hotkeyBinding, setHotkeyBinding] = useState<string>("");

  useEffect(() => {
    overwolf.settings.hotkeys.get((result) => {
      if (result.games) {
        const hotkey = result.games[gameClassId].find(
          (hotkey) => hotkey.name === name,
        );
        if (hotkey) {
          setHotkeyBinding(hotkey.binding);
        }
      }
    });

    const handleChange = (event: overwolf.settings.hotkeys.OnChangedEvent) => {
      if (event.name === name) {
        setHotkeyBinding(event.binding);
      }
    };
    overwolf.settings.hotkeys.onChanged.addListener(handleChange);

    return () => {
      overwolf.settings.hotkeys.onChanged.removeListener(handleChange);
    };
  }, []);

  return (
    <Button asChild size="sm" variant="outline">
      <a
        href={`overwolf://settings/games-overlay?hotkey=${name}&gameId=${gameClassId}`}
      >
        {hotkeyBinding || "Unassigned"}
      </a>
    </Button>
  );
}
