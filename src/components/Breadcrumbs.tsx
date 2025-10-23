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
  return (
    <nav className="flex items-center gap-2 text-sm text-[#82827c] dark:text-gray-400 mb-6">
      {/* Home icon */}
      <Link 
        href="/" 
        className="flex items-center gap-1 hover:text-[#21201c] dark:hover:text-white transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>خانه</span>
      </Link>

      {/* Breadcrumb items */}
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" />
          {item.href ? (
            <Link 
              href={item.href}
              className="hover:text-[#21201c] dark:hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[#21201c] dark:text-white font-medium">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
