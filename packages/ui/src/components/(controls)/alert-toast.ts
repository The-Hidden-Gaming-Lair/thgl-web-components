import { toast } from "sonner";
import { TOAST_DURATION } from "../ui/sonner";

let overlayWindow = false;
let nextId = 0;

/** Set by the app shells: overlay windows keep the normal alert timer. */
export function setAlertToastOverlay(isOverlay: boolean) {
  overlayWindow = isOverlay;
}

/**
 * On-screen notice for an alert (proximity audio alert, Palia event alert).
 *
 * WHY: in second-screen / desktop mode the map window usually sits behind the
 * browser or Discord while the game has focus, so a 5 s toast was gone by the
 * time the player tabbed over. While the map window is not focused the notice
 * stays up; the first time the window gets focus it restarts the normal timer.
 * Overlay windows are never focused while playing (the game is), so they keep
 * the normal timer - otherwise every overlay alert would stick forever.
 */
export function alertToast(message: string, options: { id?: string } = {}) {
  const id = options.id ?? `alert-${nextId++}`;
  if (overlayWindow || typeof document === "undefined" || document.hasFocus()) {
    toast(message, { id, duration: TOAST_DURATION });
    return;
  }
  let dismissed = false;
  toast(message, {
    id,
    duration: Infinity,
    closeButton: true,
    onDismiss: () => {
      dismissed = true;
    },
  });
  window.addEventListener(
    "focus",
    () => {
      // Re-issuing a closed toast's id would bring it back.
      if (!dismissed) toast(message, { id, duration: TOAST_DURATION });
    },
    { once: true },
  );
}
