"use client";

import { ExternalLink } from "lucide-react";
import { ExternalAnchor } from "../(header)";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useEffect, useState } from "react";
import { useSessionStorage } from "@uidotdev/usehooks";
import { useT } from "../(providers)";

export function AdBlocker() {
  const t = useT();
  const [timeLeft, setTimeLeft] = useState(10);
  const [open, setOpen] = useState(true);

  const today = new Date().toISOString().split("T")[0];
  const sessionKey = `adBlockerDismissed_${today}`;

  const [adBlockerDismissed, setAdBlockerDismissed] = useSessionStorage(
    sessionKey,
    false,
  );

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timeoutId = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timeoutId);
  }, [timeLeft]);

  if (adBlockerDismissed) return null;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent data-nosnippet>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("adblocker.title")}</AlertDialogTitle>
        </AlertDialogHeader>

        <p>{t("adblocker.intro")}</p>

        <ul className="mb-4 list-disc list-inside space-y-2">
          <li>
            <span className="font-bold">{t("adblocker.supportTitle")}</span>{" "}
            {t("adblocker.supportText")}
            <ExternalAnchor
              href="https://www.th.gl/support-me"
              className="flex gap-1 text-primary hover:underline"
            >
              <span>{t("adblocker.supportLink")}</span>
              <ExternalLink className="w-3 h-3" />
            </ExternalAnchor>
          </li>

          <li>
            <span className="font-bold">{t("adblocker.keepAdsTitle")}</span>{" "}
            {t("adblocker.keepAdsText")}
          </li>

          <li>
            <span className="font-bold">{t("adblocker.helpTitle")}</span>{" "}
            {t("adblocker.helpText")}
            <ExternalAnchor
              href="https://www.th.gl/discord"
              className="flex gap-1 text-primary hover:underline"
            >
              <span>{t("adblocker.discordLink")}</span>
              <ExternalLink className="w-3 h-3" />
            </ExternalAnchor>
          </li>
        </ul>

        <p className="text-secondary-foreground">{t("adblocker.thanks")}</p>

        <AlertDialogCancel
          disabled={timeLeft > 0}
          onClick={() => {
            setAdBlockerDismissed(true);
            setOpen(false);
          }}
        >
          {t.rich("adblocker.close", {
            components: {
              countdown: timeLeft > 0 ? ` (${timeLeft})` : "",
            },
          })}
        </AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialog>
  );
}
