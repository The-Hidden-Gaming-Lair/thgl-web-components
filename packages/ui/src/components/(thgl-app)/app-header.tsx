"use client";
import { cn, useAccountStore } from "@repo/lib";
import { useState } from "react";
import {
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../(controls)";
import { Info, Settings, User } from "lucide-react";
import { ExternalAnchor } from "../(header)";
import { AccountDialog } from "./account-dialog";
import { Dialog, DialogTrigger } from "../ui/dialog";

export function AppHeader({
  children,
  isOverlay,
  settingsDialogContent,
}: {
  children: React.ReactNode;
  isOverlay?: boolean;
  settingsDialogContent?: JSX.Element;
}) {
  const account = useAccountStore();
  const [isStartDragging, setIsStartDragging] = useState(false);

  return (
    <>
      <svg style={{ display: "none" }} xmlns="http://www.w3.org/2000/svg">
        <symbol id="window-control_close" viewBox="0 0 30 30">
          <line
            fill="none"
            stroke="currentcolor"
            strokeLinecap="round"
            x1="19.5"
            x2="10.5"
            y1="10.5"
            y2="19.5"
          />
          <line
            fill="none"
            stroke="currentcolor"
            strokeLinecap="round"
            x1="10.5"
            x2="19.5"
            y1="10.5"
            y2="19.5"
          />
        </symbol>
        <symbol id="window-control_maximize" viewBox="0 0 30 30">
          <rect
            fill="none"
            height="9"
            stroke="currentcolor"
            width="9"
            x="10.5"
            y="10.5"
          />
        </symbol>
        <symbol id="window-control_restore" viewBox="0 0 30 30">
          <polyline
            fill="none"
            points="13.5 12 13.5 9.5 20.5 9.5 20.5 16.5 18 16.5"
            stroke="currentcolor"
          />
          <rect
            fill="none"
            height="7"
            stroke="currentcolor"
            width="7"
            x="9.5"
            y="13.5"
          />
        </symbol>
        <symbol id="window-control_minimize" viewBox="0 0 30 30">
          <line
            fill="none"
            stroke="currentcolor"
            x1="10"
            x2="20"
            y1="19.5"
            y2="19.5"
          />
        </symbol>
      </svg>
      <header
        className={cn(
          "px-2 h-[32px] fixed left-0 right-0 top-0 border-b bg-gradient-to-b backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 flex items-center pointer-events-auto z-[999999]",
        )}
        onDoubleClick={() => {
          window.chrome.webview.postMessage("maximize");
        }}
        onMouseDown={() => {
          setIsStartDragging(true);
        }}
        onMouseUp={() => {
          setIsStartDragging(false);
        }}
        onMouseMove={() => {
          if (isStartDragging) {
            window.chrome.webview.postMessage("drag");
            setIsStartDragging(false);
          }
        }}
      >
        <nav
          className={cn("ml-2 grow flex items-center gap-2 text-sm font-bold")}
        >
          {children}
          <div
            className={cn("absolute top-0 right-0 h-[32px]")}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Button
              asChild
              size="icon"
              variant="ghost"
              className="h-full w-[32px]  hover:text-[#6974f3]"
            >
              <ExternalAnchor href="https://th.gl/discord">
                <svg
                  fill="currentColor"
                  height="20"
                  viewBox="0 0 16 16"
                  width="20"
                  className="h-full w-full p-1.5"
                >
                  <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z" />
                </svg>
              </ExternalAnchor>
            </Button>
            {settingsDialogContent && (
              <Dialog>
                <Button
                  asChild
                  size="icon"
                  variant="ghost"
                  className="h-full w-[32px]"
                >
                  <DialogTrigger>
                    <Settings className="h-full w-full p-1.5" />
                  </DialogTrigger>
                </Button>
                {settingsDialogContent}
              </Dialog>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-full w-[32px]"
              onClick={() => account.setShowUserDialog(true)}
            >
              <User
                className={cn(
                  "h-full w-full p-1.5",
                  account.userId && "fill-primary stroke-primary",
                )}
              />
            </Button>
            <AccountDialog />
            <HoverCard openDelay={50} closeDelay={50}>
              <HoverCardTrigger asChild>
                <Button size="icon" variant="ghost" className="h-full w-[32px]">
                  <Info className="h-full w-full p-1.5" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent side="bottom" className="w-fit flex flex-col">
                <Button asChild variant="link">
                  <ExternalAnchor href="https://www.th.gl/legal-notice">
                    Legal Notice
                  </ExternalAnchor>
                </Button>
                <Button asChild variant="link">
                  <ExternalAnchor href="https://www.th.gl/privacy-policy">
                    Privacy Policy
                  </ExternalAnchor>
                </Button>
              </HoverCardContent>
            </HoverCard>
            {!isOverlay && (
              <button
                className="h-full w-[32px] inline-flex hover:bg-neutral-700"
                onClick={() => {
                  window.chrome.webview.postMessage("minimize");
                }}
                type="button"
              >
                <svg className="h-full">
                  <use xlinkHref="#window-control_minimize" />
                </svg>
              </button>
            )}
            {!isOverlay && (
              <button
                className="h-full w-[32px] inline-flex hover:bg-neutral-700"
                onClick={() => {
                  window.chrome.webview.postMessage("maximize");
                }}
                type="button"
              >
                <svg className="h-full">
                  <use xlinkHref="#window-control_restore" />
                </svg>
              </button>
            )}
            <button
              className="h-full w-[32px] inline-flex hover:bg-red-600"
              id="close"
              onClick={() => {
                window.chrome.webview.postMessage("close");
              }}
              type="button"
            >
              <svg className="h-full">
                <use xlinkHref="#window-control_close" />
              </svg>
            </button>
          </div>
        </nav>
      </header>
    </>
  );
}
