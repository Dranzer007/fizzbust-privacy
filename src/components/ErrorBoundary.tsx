import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  private handleWindowError = (event: ErrorEvent) => {
    if (this.state.hasError) return;
    const error = event.error instanceof Error ? event.error : new Error(event.message || 'Unknown error');
    this.setState({ hasError: true, error });
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (this.state.hasError) return;
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason || 'Unhandled promise rejection'));
    this.setState({ hasError: true, error });
  };

  public componentDidMount() {
    window.addEventListener('error', this.handleWindowError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  public componentWillUnmount() {
    window.removeEventListener('error', this.handleWindowError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            isFirestoreError = true;
            errorMessage = `Database Error: ${parsed.operationType} failed on ${parsed.path || 'unknown path'}.`;
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="fixed inset-0 flex items-center justify-center bg-white p-8 z-[9999]">
          <div className="max-w-md w-full bg-black/5 p-12 rounded-[2rem] text-center flex flex-col items-center gap-6 border border-black/5">
            <div className="w-16 h-16 rounded-full bg-sunset-orange/20 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" className="w-8 h-8 fill-sunset-orange">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            </div>
            <h2 className="text-2xl font-display italic text-black uppercase tracking-tighter">System Alert</h2>
            <p className="text-xs font-mono text-black/60 uppercase tracking-widest leading-relaxed">
              {errorMessage}
            </p>
            {isFirestoreError && (
              <p className="text-[8px] font-mono text-black/20 uppercase tracking-widest">
                Please check your network connection or contact support.
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-8 py-3 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
            >
              Restart System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
