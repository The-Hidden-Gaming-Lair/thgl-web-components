import { HOTKEYS } from "@repo/lib/overwolf";
import { useEffect } from "react";
import { useMap } from "../(interactive-map)/store";

export function MapHotkeys() {
  const map = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }

    const handleHotkey = (event: overwolf.settings.hotkeys.OnPressedEvent) => {
      if (event.name === HOTKEYS.ZOOM_IN_APP) {
        map.zoomIn();
      } else if (event.name === HOTKEYS.ZOOM_OUT_APP) {
        map.zoomOut();
      }
    };
    overwolf.settings.hotkeys.onPressed.addListener(handleHotkey);

    return () => {
      overwolf.settings.hotkeys.onPressed.removeListener(handleHotkey);
    };
  }, [map]);

  return <></>;
}
