import { Component, ErrorInfo, ReactNode } from "react";
import { ExternalAnchor } from "../(header)";
import { ExternalLink } from "lucide-react";

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
        <div className="p-4">
          <h1>Sorry.. there was an error</h1>
          <p>{this.state.error?.message}</p>
          <p>
            Please join the{" "}
            <ExternalAnchor
              href="https://www.th.gl/discord"
              className="inline-flex gap-1 text-primary hover:underline"
            >
              <span>Discord server</span>
              <ExternalLink className="w-3 h-3" />
            </ExternalAnchor>{" "}
            for support.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
