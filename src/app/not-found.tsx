import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, FileRemoveIcon, Home01Icon, Search01Icon } from '@hugeicons/core-free-icons';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-lg w-full bg-card rounded-xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-muted dark:bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
          <HugeiconsIcon icon={FileRemoveIcon} size={40} className="text-muted-foreground" />
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-4">
          ۴۰۴ - صفحه یافت نشد
        </h1>
        
        <p className="text-muted-foreground mb-8">
          متأسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد یا حذف شده است.
        </p>

        <div className="space-y-6">
          <div className="flex gap-3 justify-center">
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground dark:text-foreground rounded-lg hover:bg-secondary dark:hover:bg-muted transition-colors"
            >
              <HugeiconsIcon icon={Home01Icon} size={16} />
              صفحه اصلی
            </Link>
            
            <Link
              href="/search"
              className="flex items-center gap-2 px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors"
            >
              <HugeiconsIcon icon={Search01Icon} size={16} />
              جستجو
            </Link>
          </div>

          <div className="pt-6 border-t border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              پیشنهادات ما:
            </h3>
            
            <div className="space-y-3 text-right">
              <Link
                href="/"
                className="flex items-center justify-between p-3 bg-background dark:bg-secondary rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors group"
              >
                <span className="text-secondary-foreground">مشاهده همه شاعران</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-foreground group-hover:text-muted-foreground dark:group-hover:text-secondary-foreground" />
              </Link>
              
              <Link
                href="/bookmarks"
                className="flex items-center justify-between p-3 bg-background dark:bg-secondary rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors group"
              >
                <span className="text-secondary-foreground">علاقه‌مندی‌های شما</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-foreground group-hover:text-muted-foreground dark:group-hover:text-secondary-foreground" />
              </Link>
              
              <Link
                href="/history"
                className="flex items-center justify-between p-3 bg-background dark:bg-secondary rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors group"
              >
                <span className="text-secondary-foreground">تاریخچه بازدیدها</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-foreground group-hover:text-muted-foreground dark:group-hover:text-secondary-foreground" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
