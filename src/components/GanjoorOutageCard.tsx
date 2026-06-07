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
      <h1 className="text-2xl font-bold text-foreground mb-3">
        گنجور موقتاً در دسترس نیست
      </h1>
      <p className="text-muted-foreground dark:text-secondary-foreground mb-6">
        این صفحه از منبع پشتیبان بارگذاری می‌شود و در حال حاضر اتصال به گنجور برقرار نیست.
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {showMigratedLink && (
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-warning/20 text-foreground rounded-lg hover:bg-warning dark:hover:bg-warning/30 transition-colors"
          >
            شاعران در دسترس
          </Link>
        )}
        <Link
          href={backHref}
          className="inline-block px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted dark:hover:bg-primary transition-colors"
        >
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
