'use client';

import { Component, ReactNode } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { AlertCircleIcon } from '@hugeicons/core-free-icons';
import { motion, useReducedMotion } from 'motion/react';

// Small wrapper so we can use the `useReducedMotion` hook inside a class component
function RefreshButton() {
  const shouldReduce = useReducedMotion();
  return (
    <motion.button
      onClick={() => {
        window.location.reload();
      }}
      className="px-6 py-3 bg-destructive/100 hover:bg-red-600 text-primary-foreground rounded-xl font-medium cursor-pointer"
      whileHover={shouldReduce ? {} : { scale: 1.05 }}
      whileTap={shouldReduce ? {} : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      رفرش صفحه
    </motion.button>
  );
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class FaalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Faal Error Boundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="bg-destructive/10 border border-destructive rounded-2xl p-8 max-w-md text-center">
            <HugeiconsIcon icon={AlertCircleIcon} size={48} className="text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-destructive mb-2">
              خطایی رخ داده است
            </h2>
            <p className="text-destructive mb-6">
              {this.state.error?.message || 'لطفاً صفحه را رفرش کنید یا دوباره تلاش کنید.'}
            </p>
            <RefreshButton />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

