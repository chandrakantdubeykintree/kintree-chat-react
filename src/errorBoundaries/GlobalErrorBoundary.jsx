import { Component } from "react";
import { AlertCircle } from "lucide-react";

export default class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
    // Add error logging service here (e.g., Sentry)
    console.error("Global error:", error);
    console.error("Error info:", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="mt-4 text-2xl font-bold">
              Oops! Something went wrong
            </h1>
            <p className="mt-2 text-gray-600">
              We apologize for the inconvenience. Please try one of the
              following:
            </p>
            <div className="mt-6 space-y-2">
              <button
                onClick={() => this.setState({ hasError: false })}
                className="w-full rounded-full bg-primary px-4 py-2 text-white hover:bg-primary/90"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full rounded-full border border-input bg-background px-4 py-2 hover:bg-accent hover:text-accent-foreground"
              >
                Refresh Page
              </button>
            </div>
            {import.meta.env.DEV && (
              <div className="mt-6 rounded-lg bg-muted p-4 text-left">
                <p className="font-mono text-sm text-destructive">
                  {this.state.error?.toString()}
                </p>
                <pre className="mt-2 max-h-[200px] overflow-auto text-xs text-muted-foreground">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
