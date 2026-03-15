import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-sunset-dark flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-4xl font-display italic text-sunset-pink uppercase mb-4">System Crash</h1>
          <p className="text-white/60 font-mono text-sm mb-8 uppercase tracking-widest">An unexpected pressure surge occurred.</p>
          <button
            onClick={() => window.location.reload()}
            className="glass-panel px-12 py-4 rounded-full text-sunset-teal font-black uppercase tracking-widest"
          >
            Reboot System
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
