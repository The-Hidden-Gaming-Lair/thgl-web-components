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

export function AdBlocker() {
  const [timeLeft, setTimeLeft] = useState(10);
  const [open, setOpen] = useState(true);
  const [adBlockerDismissed, setAdBlockerDismissed] = useSessionStorage(
    "ad-blocker-dismissed",
    false,
  );

  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }
    const timeoutId = setTimeout(() => {
      if (timeLeft > 0) {
        setTimeLeft(timeLeft - 1);
      }
    }, 1000);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [timeLeft]);

  if (adBlockerDismissed) {
    return null;
  }

  return (
    <AlertDialog open={open}>
      <AlertDialogContent data-nosnippet>
        <AlertDialogHeader>
          <AlertDialogTitle>⚠️ Ad Blocker Detected</AlertDialogTitle>
        </AlertDialogHeader>
        <p>
          I've noticed that you're using an ad blocker, which is preventing me
          from displaying ads on this site. As a solo developer, I rely on
          revenue from ads and subscriptions to continue developing projects
          like this one.
        </p>
        <ul className="mb-4 list-disc list-inside">
          <li>
            <span className="font-bold">Support Me:</span> Consider becoming a
            Pro or Elite subscriber to remove ads and support the development of
            this website:
            <ExternalAnchor
              href="https://www.th.gl/support-me"
              className="flex gap-1 text-primary hover:underline"
            >
              <span>Become a Subscriber</span>
              <ExternalLink className="w-3 h-3" />
            </ExternalAnchor>
          </li>
          <li>
            <span className="font-bold">Keep Ads On:</span> If you prefer not to
            subscribe, you can still support me by whitelisting this site in
            your ad blocker or Firefox strict mode.
          </li>
          <li>
            <span className="font-bold">Need Help?</span> If you have any
            questions or need assistance, feel free to join my Discord server
            for support:
            <ExternalAnchor
              href="https://www.th.gl/discord"
              className="flex gap-1 text-primary hover:underline"
            >
              <span>Join my Discord server</span>
              <ExternalLink className="w-3 h-3" />
            </ExternalAnchor>
          </li>
        </ul>
        <p className="text-secondary-foreground">
          Thank you for your understanding and support! 🙏
        </p>
        <AlertDialogCancel
          disabled={timeLeft > 0}
          onClick={() => {
            setAdBlockerDismissed(true);
            setOpen(false);
          }}
        >
          Close{timeLeft > 0 ? ` (${timeLeft})` : ""}
        </AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialog>
  );
}
