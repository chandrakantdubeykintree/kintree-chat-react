import { Suspense } from "react";
import ComponentErrorBoundary from "../errorBoundaries/ComponentErrorBoundary";
import ComponentLoading from "./component-loading";

export default function AsyncComponent({ children }) {
  return (
    <ComponentErrorBoundary>
      <Suspense fallback={<ComponentLoading />}>{children}</Suspense>
    </ComponentErrorBoundary>
  );
}
