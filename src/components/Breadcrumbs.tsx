import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, Home01Icon } from '@hugeicons/core-free-icons';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  // Filter out the last item if it doesn't have an href (current page)
  const breadcrumbItems = items.filter((item, index) => {
    // Keep all items except the last one if it doesn't have an href
    return !(index === items.length - 1 && !item.href);
  });

  return (
    <nav
      className="flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1 text-sm border-b border-primary/10 pb-4"
      aria-label="مسیر صفحه"
    >
      {/* Home icon */}
      <Link
        href="/"
        className="flex shrink-0 items-center gap-1 hover:text-[#21201c] dark:hover:text-primary-foreground transition-colors"
      >
        <HugeiconsIcon icon={Home01Icon} size={16} className="shrink-0" />
        <span>خانه</span>
      </Link>

      {/* Breadcrumb items */}
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex min-w-0 max-w-full items-center gap-2">
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4 shrink-0" aria-hidden />
          {item.href ? (
            <Link
              href={item.href}
              className="min-w-0 max-w-full break-words [overflow-wrap:anywhere] hover:text-[#21201c] dark:hover:text-primary-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="min-w-0 max-w-full break-words [overflow-wrap:anywhere] font-medium text-[#21201c] dark:text-primary-foreground">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
