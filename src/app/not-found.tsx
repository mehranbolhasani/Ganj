import Link from 'next/link';
import { FileX, Home, Search, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900 p-4">
      <div className="max-w-lg w-full bg-white dark:bg-stone-800 rounded-xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-stone-100 dark:bg-stone-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileX className="w-10 h-10 text-stone-600 dark:text-stone-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-4">
          ۴۰۴ - صفحه یافت نشد
        </h1>
        
        <p className="text-stone-600 dark:text-stone-400 mb-8">
          متأسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد یا حذف شده است.
        </p>

        <div className="space-y-6">
          <div className="flex gap-3 justify-center">
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors"
            >
              <Home className="w-4 h-4" />
              صفحه اصلی
            </Link>
            
            <Link
              href="/search"
              className="flex items-center gap-2 px-6 py-3 bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-100 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
            >
              <Search className="w-4 h-4" />
              جستجو
            </Link>
          </div>

          <div className="pt-6 border-t border-stone-200 dark:border-stone-700">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
              پیشنهادات ما:
            </h3>
            
            <div className="space-y-3 text-right">
              <Link
                href="/"
                className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors group"
              >
                <span className="text-stone-700 dark:text-stone-300">مشاهده همه شاعران</span>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300" />
              </Link>
              
              <Link
                href="/bookmarks"
                className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors group"
              >
                <span className="text-stone-700 dark:text-stone-300">علاقه‌مندی‌های شما</span>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300" />
              </Link>
              
              <Link
                href="/history"
                className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors group"
              >
                <span className="text-stone-700 dark:text-stone-300">تاریخچه بازدیدها</span>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
