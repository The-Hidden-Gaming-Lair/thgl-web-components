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
      return (
        <div className="p-4 space-y-1">
          <p>
            Sorry.. there was an error. Please join the{" "}
            <ExternalAnchor
              href="https://www.th.gl/discord"
              className="inline-flex gap-1 text-primary hover:underline"
            >
              <span>Discord server</span>
              <ExternalLink className="w-3 h-3" />
            </ExternalAnchor>{" "}
            for support.
          </p>
          <Button onClick={() => window.location.reload()}>Reload now!</Button>
          <p className="text-muted-foreground font-mono">
            {this.state.error?.stack
              ?.split("\n")
              .map((line, index) => <div key={index}>{line}</div>)}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
