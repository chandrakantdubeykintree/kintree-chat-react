import { AsyncComponent } from "../components/async-component";
import { ErrorBoundaryProvider } from "./ErrorBoundaryProvider";

export function withErrorBoundary(WrappedComponent) {
  return function WithErrorBoundaryComponent(props) {
    return (
      <AsyncComponent>
        <ErrorBoundaryProvider>
          <WrappedComponent {...props} />
        </ErrorBoundaryProvider>
      </AsyncComponent>
    );
  };
}
