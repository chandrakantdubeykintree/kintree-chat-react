import { Component } from "react";

class ComponentErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Component Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 m-4 border border-red-500 rounded-lg">
          {import.meta.env.DEV && (
            <>
              <h3 className="text-xl font-bold text-red-500 mb-2">
                Component Error
              </h3>
              <pre className="bg-gray-100 p-4 rounded-lg mb-4 overflow-auto text-sm">
                {this.state.error?.message || "Unknown error occurred"}
                {this.state.error?.stack && (
                  <div className="mt-2 text-gray-600">
                    {this.state.error.stack}
                  </div>
                )}
              </pre>
            </>
          )}
          <p className="text-gray-600 mb-4">
            Something went wrong, try again later.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ComponentErrorBoundary;
