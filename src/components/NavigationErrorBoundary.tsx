import React, { Component, ErrorInfo, ReactNode } from 'react';
import { navigationErrorLogger } from '@/utils/navigationErrorLogger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class NavigationErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to our navigation error logger
    navigationErrorLogger.logNavigationError(
      window.location.pathname,
      'navigation_error',
      `Navigation Error: ${error.message}. Stack: ${errorInfo.componentStack}`
    );

    console.error('Navigation Error caught by boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center max-w-md mx-auto p-6">
            <h1 className="text-4xl font-bold mb-4 text-red-600">Oops!</h1>
            <p className="text-xl text-gray-600 mb-4">
              Something went wrong with navigation
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  window.location.reload();
                }}
                className="block w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Reload Page
              </button>
              <a
                href="/"
                className="block w-full bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-center"
              >
                Return to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default NavigationErrorBoundary;