"use client";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * One-time dashboard notice for when the native app stripped the Windows
 * Compatibility "Run as administrator" flag from THGLApp.exe at startup
 * (dispatched from initializeApp after getInitialState). Without the notice
 * the user's Properties > Compatibility checkbox would just silently revert.
 */
export function CompatFlagNotice() {
  useEffect(() => {
    const handler = () => {
      toast.info(
        'Windows was forcing TH.GL to run as administrator (Properties > Compatibility). That setting breaks license verification and storage, so it was removed — use the app\'s own "Admin Mode" in Settings instead; the app asks for it when a game needs it.',
        { duration: 20000 },
      );
    };
    window.addEventListener("thgl-app:compat-flag-removed", handler);
    return () =>
      window.removeEventListener("thgl-app:compat-flag-removed", handler);
  }, []);

  return null;
}
