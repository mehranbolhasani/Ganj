'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw, Search } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900 p-4">
      <div className="max-w-lg w-full bg-white dark:bg-stone-800 rounded-xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-4">
          خطایی رخ داده است
        </h1>
        
        <p className="text-stone-600 dark:text-stone-400 mb-8">
          متأسفانه مشکلی در بارگذاری صفحه پیش آمده است. لطفاً دوباره تلاش کنید یا به صفحه اصلی برگردید.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="mb-8 text-left">
            <summary className="cursor-pointer text-sm text-stone-500 dark:text-stone-400 mb-4">
              جزئیات خطا (فقط در حالت توسعه)
            </summary>
            <pre className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-4 rounded overflow-auto">
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
              className="flex items-center gap-2 px-6 py-3 bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-100 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              تلاش مجدد
            </button>
            
            <Link
              href="/"
              aria-label="بازگشت به صفحه اصلی"
              className="flex items-center gap-2 px-6 py-3 bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors"
            >
              <Home className="w-4 h-4" />
              صفحه اصلی
            </Link>
          </div>

          <div className="pt-4 border-t border-stone-200 dark:border-stone-700">
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">
              یا می‌توانید:
            </p>
            <div className="flex gap-2 justify-center">
              <Link
                href="/search"
                aria-label="جستجو در سایت"
                className="flex items-center gap-2 px-4 py-2 text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
              >
                <Search className="w-4 h-4" />
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
