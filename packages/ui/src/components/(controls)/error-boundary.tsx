"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { ExternalAnchor } from "../(header)";
import { ExternalLink } from "lucide-react";
import { Button } from "../ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(err: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: err };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Next's own control-flow errors (`notFound()` -> NEXT_NOT_FOUND / NEXT_HTTP_ERROR_FALLBACK,
      // `redirect()` -> NEXT_REDIRECT) travel as thrown errors too. On a CLIENT-SIDE navigation
      // they reach this boundary before Next's not-found / redirect boundaries above it, so
      // catching them here turned a missing codex entry into "Something went wrong" (a direct
      // load 404s correctly). Re-throw them; only real errors get the fallback UI.
      const digest = (this.state.error as { digest?: unknown } | null)?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_")) {
        throw this.state.error;
      }
      // Thrown by the web-map's createGL (packages/lib/src/web-map/utils/gl.ts). A settings
      // problem on the user's side, not a bug — show how to fix it instead of the crash box.
      if (this.state.error?.name === "WebGLUnsupportedError") {
        return <WebGLUnsupported />;
      }
      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-background">
          <div className="w-full max-w-2xl space-y-6 p-6 rounded-lg border border-destructive/50 bg-destructive/5">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-destructive">
                Something went wrong
              </h2>
              <p className="text-base text-foreground/90">
                Sorry, there was an unexpected error. Please join the{" "}
                <ExternalAnchor
                  href="https://www.th.gl/discord"
                  className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                >
                  <span>Discord server</span>
                  <ExternalLink className="w-3 h-3" />
                </ExternalAnchor>{" "}
                for support.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded border border-destructive/30 bg-destructive/10">
                <p className="text-sm font-mono text-foreground wrap-break-word">
                  {this.state.error.name && this.state.error.name !== "Error"
                    ? `${this.state.error.name}: `
                    : ""}
                  {this.state.error.message}
                </p>
              </div>
            )}

            <Button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto"
            >
              Reload now
            </Button>

            {this.state.error?.stack && (
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Show error details
                </summary>
                <div className="mt-3 p-4 rounded border border-border bg-muted/50 overflow-auto max-h-64">
                  <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">
                    {this.state.error.stack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const WEBGL_FIXES: { title: string; steps: ReactNode }[] = [
  {
    title: "Chrome, Edge, Opera, Brave",
    steps: (
      <>
        Open <Code>Settings → System</Code>, turn on{" "}
        <strong>Use graphics acceleration when available</strong> and click{" "}
        <strong>Relaunch</strong>.
      </>
    ),
  },
  {
    title: "Firefox",
    steps: (
      <>
        Open <Code>Settings → General → Performance</Code>, untick{" "}
        <strong>Use recommended performance settings</strong>, then tick{" "}
        <strong>Use hardware acceleration when available</strong> and restart
        Firefox.
      </>
    ),
  },
  {
    title: "iPhone, iPad",
    steps: (
      <>
        Update to iOS 15 or newer. <strong>Lockdown Mode</strong> also blocks
        WebGL — turn it off in <Code>Settings → Privacy &amp; Security</Code> or
        exclude this site in Safari.
      </>
    ),
  },
  {
    title: "Android",
    steps: (
      <>
        Update Chrome (and <strong>Android System WebView</strong>) from the
        Play Store, or try Chrome if you use another browser.
      </>
    ),
  },
];

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="px-1 py-0.5 rounded bg-muted text-foreground text-[0.9em]">
      {children}
    </code>
  );
}

function WebGLUnsupported() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-2xl space-y-6 p-4 sm:p-6 rounded-lg border border-primary/40 bg-primary/5">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">
            Your browser can&apos;t display the map
          </h2>
          <p className="text-base text-foreground/90">
            The interactive map needs WebGL2, which your browser couldn&apos;t
            start. On a computer this almost always means graphics (hardware)
            acceleration is turned off in the browser. Here&apos;s how to fix
            it:
          </p>
        </div>

        <ol className="space-y-3">
          {WEBGL_FIXES.map((fix) => (
            <li key={fix.title} className="text-sm text-foreground/90">
              <p className="font-semibold text-foreground">{fix.title}</p>
              <p>{fix.steps}</p>
            </li>
          ))}
        </ol>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Still not working?</p>
          <p>
            Update your graphics drivers, then check{" "}
            <ExternalAnchor
              href="https://get.webgl.org/webgl2/"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <span>get.webgl.org/webgl2</span>
              <ExternalLink className="w-3 h-3" />
            </ExternalAnchor>{" "}
            — if the cube doesn&apos;t spin there, WebGL2 is blocked for your
            GPU. Ask in the{" "}
            <ExternalAnchor
              href="https://www.th.gl/discord"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <span>Discord server</span>
              <ExternalLink className="w-3 h-3" />
            </ExternalAnchor>{" "}
            if you&apos;re stuck.
          </p>
        </div>

        <Button
          onClick={() => window.location.reload()}
          className="w-full sm:w-auto"
        >
          Reload now
        </Button>
      </div>
    </div>
  );
}
