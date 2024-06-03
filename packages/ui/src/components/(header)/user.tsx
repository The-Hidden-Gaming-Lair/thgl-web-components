import { Heart } from "lucide-react";
import { Button } from "../(controls)";
import { useT } from "../(providers)";
import { ExternalAnchor } from "./external-anchor";
import { cn, useAccountStore } from "@repo/lib";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";

export function User({ isExpanded }: { isExpanded: boolean }) {
  const user = useAccountStore();

  const t = useT();

  if (user.userId) {
    return (
      <HoverCard openDelay={50} closeDelay={50}>
        <HoverCardTrigger asChild>
          <Button
            size={isExpanded ? "default" : "icon"}
            title={t("about")}
            variant="secondary"
          >
            <Heart className={cn("fill-primary stroke-primary")} />
            <span
              className={cn("ml-2", {
                hidden: !isExpanded,
              })}
            >
              {t("subscriber")}
            </span>
          </Button>
        </HoverCardTrigger>
        <HoverCardContent side="right" className="w-fit flex flex-col">
          <div className="p-2">
            <p className="font-bold">Ad Removal</p>
            <p>{user.adRemoval ? "Yes" : "No"}</p>
          </div>
          <div className="p-2">
            <p className="font-bold">Preview Release Access</p>
            <p>{user.previewReleaseAccess ? "Yes" : "No"}</p>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }
  return (
    <Button
      asChild
      size={isExpanded ? "default" : "icon"}
      title={t("support_me")}
      variant="secondary"
    >
      <ExternalAnchor href="https://www.th.gl/support-me">
        <Heart />
        <span
          className={cn("ml-2", {
            hidden: !isExpanded,
          })}
        >
          {t("support_me")}
        </span>
      </ExternalAnchor>
    </Button>
  );
}
