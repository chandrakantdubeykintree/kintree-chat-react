import { useAnalytics } from "../hooks/useAnalytics";
import { Component } from "react";

class AnalyticsErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Analytics Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.children;
    }

    return this.props.children;
  }
}

export function AnalyticsProvider({ children }) {
  // Just use the hook, don't try to render its return value
  useAnalytics();

  return <AnalyticsErrorBoundary>{children}</AnalyticsErrorBoundary>;
}
