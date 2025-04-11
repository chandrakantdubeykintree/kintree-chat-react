export function useErrorReporting() {
  return {
    logError: (error: Error, info: { componentStack: string }) => {
      // Add your error reporting service here (e.g., Sentry)
      if (import.meta.env.PROD) {
        // Production error logging
        console.error("Error:", error);
        console.error("Component Stack:", info.componentStack);
      }
    },
  };
}
