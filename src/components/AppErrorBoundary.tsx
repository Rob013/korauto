import React from 'react';

type AppErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Unhandled app error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ marginBottom: 16 }}>Please refresh the page. If the problem persists, try clearing the site data.</p>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f6f6', padding: 12, borderRadius: 8 }}>
              {String(this.state.error.stack || this.state.error.message)}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

