"use client";
import { cn, useAccountStore } from "@repo/lib";
import { useState, type JSX } from "react";
import {
  sendDebugSnapshot,
  setCloseAction as setCloseActionApi,
  useLiveState,
  CloseAction,
} from "@repo/lib/thgl-app";
import { Button, Checkbox, Label } from "../(controls)";
import {
  Bug,
  CircleUser,
  ExternalLink as ExternalLinkIcon,
  LogOut,
  Menu,
  Minus,
  Settings,
  Shield,
} from "lucide-react";
import {
  ExternalAnchor,
  DiscordIcon,
  GitHubIcon,
  RedditIcon,
  WindowControlSymbols,
} from "../(header)";
import { AccountDialog } from "./account-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { ScriptLoader } from "../(ads)/nitro-script";
import ConsentLink from "../(ads)/consent-link";

export function AppHeader({
  title,
  children,
  isOverlay,
  settingsDialogContent,
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
  isOverlay?: boolean;
  settingsDialogContent?: JSX.Element;
}) {
  const account = useAccountStore();
  const isRunningAsAdmin = useLiveState((state) => state.isRunningAsAdmin);
  const closeAction = useLiveState((state) => state.closeAction);
  const setCloseAction = useLiveState((state) => state.setCloseAction);
  const [isStartDragging, setIsStartDragging] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [rememberChoice, setRememberChoice] = useState(false);
  const [debugContext, setDebugContext] = useState("");
  const [isSendingDebug, setIsSendingDebug] = useState(false);
  const [isDebugDialogOpen, setIsDebugDialogOpen] = useState(false);
  const [debugStatus, setDebugStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSendDebugSnapshot = async () => {
    setIsSendingDebug(true);
    setDebugStatus("idle");
    try {
      await sendDebugSnapshot(debugContext || "No additional context provided");
      setDebugContext("");
      setDebugStatus("success");
      // Auto-close dialog after 2 seconds on success
      setTimeout(() => {
        setIsDebugDialogOpen(false);
        setDebugStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Failed to send debug snapshot:", error);
      setDebugStatus("error");
    } finally {
      setIsSendingDebug(false);
    }
  };

  // Optional chaining on window.chrome?.webview allows safe execution when testing
  // the app header in browser environments where native WebView2 IPC is not present.
  const handleCloseClick = () => {
    if (closeAction === "ask") {
      setRememberChoice(false);
      setIsCloseDialogOpen(true);
      return;
    }
    if (closeAction === "closeWindow") {
      window.chrome?.webview?.postMessage("closeWindow");
    } else {
      window.chrome?.webview?.postMessage("exitApp");
    }
  };

  const handleCloseChoice = (choice: "closeWindow" | "exit") => {
    if (rememberChoice) {
      const action: CloseAction =
        choice === "closeWindow" ? "closeWindow" : "exit";
      setCloseActionApi(action)
        .then(() => setCloseAction(action))
        .catch(console.error);
    }
    setIsCloseDialogOpen(false);
    if (choice === "closeWindow") {
      window.chrome?.webview?.postMessage("closeWindow");
    } else {
      window.chrome?.webview?.postMessage("exitApp");
    }
  };

  // Right button count: window controls + settings? + user + burger
  const windowControlCount = isOverlay ? 1 : 3; // close + min + max
  const actionButtonCount = 2 + (settingsDialogContent ? 1 : 0); // user, burger (+ settings)
  const rightPx = (windowControlCount + actionButtonCount) * 32;

  return (
    <>
      <WindowControlSymbols />
      <header
        className={cn(
          "px-2 h-[32px] fixed left-0 right-0 top-0 border-b bg-linear-to-b backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 flex items-center pointer-events-auto z-999999",
        )}
        onDoubleClick={() => {
          window.chrome?.webview?.postMessage("maximize");
        }}
        onMouseDown={() => {
          setIsStartDragging(true);
        }}
        onMouseUp={() => {
          setIsStartDragging(false);
        }}
        onMouseMove={() => {
          if (isStartDragging) {
            window.chrome?.webview?.postMessage("drag");
            setIsStartDragging(false);
          }
        }}
      >
        {title && (
          <div className="ml-2 shrink-0 flex items-center gap-2 text-sm font-bold">
            {title}
            {isRunningAsAdmin && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-500 border border-amber-500/20">
                <Shield className="w-3 h-3" />
                <span>Admin</span>
              </div>
            )}
          </div>
        )}
        <nav
          className="ml-2 grow flex items-center gap-2 text-sm font-bold overflow-hidden"
          style={{ paddingRight: rightPx }}
        >
          {children}
          {!title && isRunningAsAdmin && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-500 border border-amber-500/20">
              <Shield className="w-3 h-3" />
              <span>Admin</span>
            </div>
          )}
        </nav>

        {/* Right side buttons */}
        <div
          className="absolute top-0 right-0 h-[32px] flex items-center"
          onDoubleClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Settings — outline style matching web */}
          {settingsDialogContent && (
            <Button
              size="icon"
              variant="outline"
              className="h-6 w-6 mx-0.5"
              onClick={() => setIsSettingsOpen((v) => !v)}
              title="Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          )}
          {/* User — outline style matching web */}
          <Button
            size="icon"
            variant="outline"
            className="h-6 w-6 mx-0.5"
            onClick={() => account.setShowUserDialog(!account.showUserDialog)}
            title="Account"
          >
            <CircleUser
              className={cn("h-3.5 w-3.5", account.userId && "text-primary")}
            />
          </Button>
          {/* Burger menu — always visible */}
          <button
            className="h-full w-[32px] inline-flex items-center justify-center hover:bg-neutral-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            type="button"
            title="Menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Window controls */}
          {!isOverlay && (
            <button
              className="h-full w-[32px] inline-flex hover:bg-neutral-700"
              onClick={() => {
                window.chrome?.webview?.postMessage("minimize");
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
                window.chrome?.webview?.postMessage("maximize");
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
            onClick={handleCloseClick}
            type="button"
          >
            <svg className="h-full">
              <use xlinkHref="#window-control_close" />
            </svg>
          </button>
        </div>
      </header>

      {/* Burger menu panel — all screen sizes */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-999998"
            onClick={() => setIsMenuOpen(false)}
          />
          <div
            className="fixed top-[32px] right-0 w-64 bg-zinc-900/95 backdrop-blur-xl border-b border-l border-neutral-800 p-3 flex flex-col gap-2 z-999998 pointer-events-auto"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Social links */}
            <div className="flex items-center gap-1">
              <ExternalAnchor
                className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-[#6974f3] transition-colors"
                href="https://th.gl/discord"
                title="Discord"
              >
                <DiscordIcon size={14} />
              </ExternalAnchor>
              <ExternalAnchor
                className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
                href="https://github.com/The-Hidden-Gaming-Lair"
                title="GitHub"
              >
                <GitHubIcon size={14} className="opacity-70" />
              </ExternalAnchor>
              <ExternalAnchor
                className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
                href="https://www.reddit.com/r/TheHiddenGamingLair/"
                title="Reddit"
              >
                <RedditIcon size={14} className="opacity-70" />
              </ExternalAnchor>
              <div className="grow" />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => {
                  setIsDebugDialogOpen(true);
                  setIsMenuOpen(false);
                }}
                title="Send Debug Snapshot"
              >
                <Bug className="w-4 h-4" />
              </Button>
            </div>
            <Separator />
            {/* Legal links */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <ExternalAnchor
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                href="https://www.th.gl/legal-notice"
              >
                Legal Notice
                <ExternalLinkIcon className="w-2.5 h-2.5 opacity-40" />
              </ExternalAnchor>
              <ExternalAnchor
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                href="https://www.th.gl/privacy-policy"
              >
                Privacy Policy
                <ExternalLinkIcon className="w-2.5 h-2.5 opacity-40" />
              </ExternalAnchor>
              <ScriptLoader>
                <ConsentLink />
              </ScriptLoader>
            </div>
          </div>
        </>
      )}

      {/* Settings dialog (controlled) */}
      {settingsDialogContent && (
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          {settingsDialogContent}
        </Dialog>
      )}

      {/* Debug snapshot dialog */}
      <Dialog open={isDebugDialogOpen} onOpenChange={setIsDebugDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Debug Snapshot</DialogTitle>
            <DialogDescription>
              For bug reports, please join our{" "}
              <a
                href="https://th.gl/discord"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                Discord server
              </a>{" "}
              and describe your issue there. Only send debug logs if asked by
              support.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Description provided to support (e.g., 'Standing next to ore that is not detected')"
              value={debugContext}
              onChange={(e) => setDebugContext(e.target.value)}
              rows={5}
              disabled={isSendingDebug}
            />
            {debugStatus === "success" && (
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                ✓ Debug snapshot sent successfully!
              </div>
            )}
            {debugStatus === "error" && (
              <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                ✗ Failed to send debug snapshot. Check console for details.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDebugDialogOpen(false);
                setDebugStatus("idle");
              }}
              disabled={isSendingDebug}
            >
              Cancel
            </Button>
            <Button onClick={handleSendDebugSnapshot} disabled={isSendingDebug}>
              {isSendingDebug ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account dialog */}
      <AccountDialog />

      {/* Close action dialog */}
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Close window</DialogTitle>
            <DialogDescription>What would you like to do?</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <button
              type="button"
              className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent transition-colors"
              onClick={() => handleCloseChoice("closeWindow")}
            >
              <Minus className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Close this window</div>
                <div className="text-xs text-muted-foreground">
                  Close the window, app keeps running in background
                </div>
              </div>
            </button>
            <button
              type="button"
              className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent transition-colors"
              onClick={() => handleCloseChoice("exit")}
            >
              <LogOut className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Exit application</div>
                <div className="text-xs text-muted-foreground">
                  Quit the entire app
                </div>
              </div>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember-close-choice"
              checked={rememberChoice}
              onCheckedChange={(checked) => setRememberChoice(checked === true)}
            />
            <Label
              htmlFor="remember-close-choice"
              className="text-sm font-normal text-muted-foreground cursor-pointer select-none"
            >
              Remember my choice
            </Label>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
