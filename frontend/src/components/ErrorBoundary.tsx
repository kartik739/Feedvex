import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you would send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: 'var(--space-8)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '4rem',
              marginBottom: 'var(--space-4)',
            }}
          >
            ⚠️
          </div>
          <h2
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-3)',
            }}
          >
            Oops! Something went wrong
          </h2>
          <p
            style={{
              fontSize: 'var(--font-size-base)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-6)',
              maxWidth: '500px',
            }}
          >
            We're sorry for the inconvenience. An unexpected error occurred. Please try refreshing the page or contact
            support if the problem persists.
          </p>
          {this.state.error && (
            <details
              style={{
                marginBottom: 'var(--space-6)',
                padding: 'var(--space-4)',
                background: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-md)',
                maxWidth: '600px',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Error Details
              </summary>
              <pre
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-error)',
                  overflow: 'auto',
                  margin: 0,
                }}
              >
                {this.state.error.toString()}
              </pre>
            </details>
          )}
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: 'var(--space-3) var(--space-6)',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-secondary)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'var(--color-primary)')}
            >
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              style={{
                padding: 'var(--space-3) var(--space-6)',
                background: 'transparent',
                color: 'var(--color-primary)',
                border: '1px solid var(--color-primary)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--color-primary)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--color-primary)';
              }}
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
