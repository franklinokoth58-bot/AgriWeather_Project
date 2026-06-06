import { Component } from 'react';

/**
 * ErrorBoundary — catches React render errors in a subtree.
 * @prop {React.ReactNode} children
 * @prop {React.ReactNode} [fallback] - Custom fallback UI
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-6 text-center my-4">
          <div className="text-3xl mb-2">⚠️</div>
          <p className="font-semibold text-red-700 dark:text-red-400">Something went wrong</p>
          <p className="text-sm text-red-600 dark:text-red-500 mt-1 font-mono">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
