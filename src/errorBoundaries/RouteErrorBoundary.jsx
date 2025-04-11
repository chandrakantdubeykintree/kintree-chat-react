import { useNavigate, useLocation } from "react-router";
import { Component } from "react";

// Class component for error boundary
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return this.props.fallback;
  }
}

// Function component for error UI
function ErrorFallback() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold">Oops!</h1>
        <p className="mb-4 text-gray-600">
          Something went wrong at {location.pathname}
        </p>
        <div className="space-x-4">
          <button
            onClick={handleGoBack}
            className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            Go Back
          </button>
          <button
            onClick={handleGoHome}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RouteErrorBoundary({ children }) {
  return <ErrorBoundary fallback={<ErrorFallback />}>{children}</ErrorBoundary>;
}
