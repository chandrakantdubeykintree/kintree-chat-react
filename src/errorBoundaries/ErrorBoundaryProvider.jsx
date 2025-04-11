import { ComponentErrorBoundary } from "./ComponentErrorBoundary";
import { useErrorReporting } from "../hooks/useErrorReporting";

export function ErrorBoundaryProvider({ children }) {
  const { logError } = useErrorReporting();

  return (
    <ComponentErrorBoundary onError={logError}>
      {children}
    </ComponentErrorBoundary>
  );
}
