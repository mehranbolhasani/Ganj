import Link from 'next/link';

interface GanjoorOutageCardProps {
  backHref?: string;
  backLabel?: string;
  showMigratedLink?: boolean;
}

export default function GanjoorOutageCard({
  backHref = '/',
  backLabel = 'بازگشت به صفحه اصلی',
  showMigratedLink = true,
}: GanjoorOutageCardProps) {
  return (
    <div className="text-center py-8">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-300 mb-3">
        گنجور موقتاً در دسترس نیست
      </h1>
      <p className="text-stone-600 dark:text-stone-300 mb-6">
        این صفحه از منبع پشتیبان بارگذاری می‌شود و در حال حاضر اتصال به گنجور برقرار نیست.
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {showMigratedLink && (
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100 rounded-lg hover:bg-amber-300 dark:hover:bg-amber-900 transition-colors"
          >
            شاعران در دسترس
          </Link>
        )}
        <Link
          href={backHref}
          className="inline-block px-4 py-2 bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-300 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-800 transition-colors"
        >
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
