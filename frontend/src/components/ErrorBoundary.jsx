import React from 'react';
import { AlertTriangle, RotateCcw, Home, ShieldAlert } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoDashboard = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = this.props.dashboardPath || '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || 'An unexpected rendering error occurred.';
      const isDashboardScope = Boolean(this.props.isDashboardScope);

      return (
        <div
          className={`flex items-center justify-center p-6 ${
            isDashboardScope ? 'min-h-[400px] w-full' : 'min-h-screen bg-slate-50 w-full'
          }`}
        >
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block mb-2">
                Application Stability Guard
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                {this.props.title || 'Component Encountered an Issue'}
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                {this.props.description ||
                  'The application caught a component error and safely prevented a blank screen. Your wallet session and credentials remain completely secure.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left">
              <p className="text-[11px] font-mono text-rose-600 break-words line-clamp-3">
                {errorMessage}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={this.handleRetry}
                className="flex-1 px-4 py-2.5 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Try Again
              </button>
              <button
                onClick={this.handleGoDashboard}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" /> Dashboard
              </button>
            </div>

            {process.env.NODE_ENV !== 'production' && this.state.errorInfo && (
              <details className="text-left text-[10px] text-slate-400 font-mono mt-3 cursor-pointer">
                <summary className="hover:text-slate-600">View component stack trace</summary>
                <pre className="mt-2 p-2 bg-slate-900 text-slate-300 rounded overflow-x-auto max-h-40">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
