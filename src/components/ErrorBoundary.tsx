'use client';

import React from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, Home01Icon, RefreshIcon } from '@hugeicons/core-free-icons';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.retry} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <HugeiconsIcon icon={Alert02Icon} size={32} className="text-destructive" />
            </div>
            
            <h1 className="text-xl font-semibold text-foreground mb-2">
              خطایی رخ داده است
            </h1>
            
            <p className="text-muted-foreground mb-6">
              متأسفانه مشکلی در بارگذاری صفحه پیش آمده است. لطفاً دوباره تلاش کنید.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
                  جزئیات خطا (فقط در حالت توسعه)
                </summary>
                <pre className="text-xs text-destructive bg-destructive/10 p-3 rounded overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.retry}
                className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors"
              >
                <HugeiconsIcon icon={RefreshIcon} size={16} />
                تلاش مجدد
              </button>
              
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground dark:text-foreground rounded-lg hover:bg-secondary dark:hover:bg-muted transition-colors"
              >
                <HugeiconsIcon icon={Home01Icon} size={16} />
                صفحه اصلی
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
