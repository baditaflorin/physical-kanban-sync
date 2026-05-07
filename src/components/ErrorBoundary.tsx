import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(error, errorInfo);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <main className="fatal-shell">
          <section className="fatal-panel">
            <p className="eyebrow">Render fault</p>
            <h1>Board paused</h1>
            <p>{this.state.error.message}</p>
            <button
              className="icon-button primary"
              type="button"
              onClick={() => this.setState({ error: null })}
            >
              Reset View
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
