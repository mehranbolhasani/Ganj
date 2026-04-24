import Link from 'next/link';
import { ChevronLeft, Home } from 'lucide-react';

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
      className="mb-6 flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#82827c] dark:text-gray-400"
      aria-label="مسیر صفحه"
    >
      {/* Home icon */}
      <Link 
        href="/" 
        className="flex shrink-0 items-center gap-1 hover:text-[#21201c] dark:hover:text-white transition-colors"
      >
        <Home className="w-4 h-4 shrink-0" />
        <span>خانه</span>
      </Link>

      {/* Breadcrumb items */}
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex min-w-0 max-w-full items-center gap-2">
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          {item.href ? (
            <Link 
              href={item.href}
              className="min-w-0 max-w-full break-words [overflow-wrap:anywhere] hover:text-[#21201c] dark:hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="min-w-0 max-w-full break-words [overflow-wrap:anywhere] font-medium text-[#21201c] dark:text-white">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
