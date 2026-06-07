'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, Home01Icon, RefreshIcon, Search01Icon } from '@hugeicons/core-free-icons';

const Error = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-lg w-full bg-card rounded-xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <HugeiconsIcon icon={Alert02Icon} size={40} className="text-destructive" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-4">
          خطایی رخ داده است
        </h1>
        
        <p className="text-muted-foreground mb-8">
          متأسفانه مشکلی در بارگذاری صفحه پیش آمده است. لطفاً دوباره تلاش کنید یا به صفحه اصلی برگردید.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="mb-8 text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground mb-4">
              جزئیات خطا (فقط در حالت توسعه)
            </summary>
            <pre className="text-xs text-destructive bg-destructive/10 p-4 rounded overflow-auto">
              {error.message}
              {error.stack && `\n\nStack trace:\n${error.stack}`}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}

        <div className="space-y-4">
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              aria-label="تلاش مجدد برای بارگذاری صفحه"
              className="flex items-center gap-2 px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors"
            >
              <HugeiconsIcon icon={RefreshIcon} size={16} />
              تلاش مجدد
            </button>
            
            <Link
              href="/"
              aria-label="بازگشت به صفحه اصلی"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground dark:text-foreground rounded-lg hover:bg-secondary dark:hover:bg-muted transition-colors"
            >
              <HugeiconsIcon icon={Home01Icon} size={16} />
              صفحه اصلی
            </Link>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              یا می‌توانید:
            </p>
            <div className="flex gap-2 justify-center">
              <Link
                href="/search"
                aria-label="جستجو در سایت"
                className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground dark:hover:text-secondary-foreground transition-colors"
              >
                <HugeiconsIcon icon={Search01Icon} size={16} />
                جستجو کنید
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Error;
