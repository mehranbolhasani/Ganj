import Link from 'next/link';
import { Category } from '@/lib/types';

interface CategoryListProps {
  categories: Category[];
  poetId: number;
  isFamous?: boolean;
}

export default function CategoryList({ categories, poetId, isFamous = false }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-stone-500 dark:text-stone-300">
          هیچ مجموعه‌ای یافت نشد
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/poet/${poetId}/category/${category.id}`}
          className={`block p-4 rounded-xl shadow-lg/5 hover:shadow-sm transition-all duration-200 backdrop-blur-md ${
            isFamous 
              ? 'bg-gradient-to-br from-amber-50/80 to-orange-50/80 border border-amber-200/50 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-700/50 hover:from-amber-100/80 hover:to-orange-100/80 dark:hover:from-amber-800/30 dark:hover:to-orange-800/30' 
              : 'bg-white/50 border border-white dark:bg-stone-800/50 dark:border-stone-700'
          }`}
        >
          <h3 className={`text-lg font-semibold ${
            isFamous 
              ? 'text-amber-900 dark:text-amber-100' 
              : 'text-stone-900 dark:text-stone-300'
          }`}>
            {category.title}
          </h3>
          {category.description && (
            <p className="text-stone-600 dark:text-stone-300 text-sm mb-2 line-clamp-2">
              {category.description}
            </p>
          )}
          {category.poemCount && (
            <p className="text-stone-500 dark:text-stone-300 text-xs">
              {category.poemCount} شعر
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}
