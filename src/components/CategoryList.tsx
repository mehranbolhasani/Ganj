import Link from 'next/link';
import { Category } from '@/lib/types';

interface CategoryListProps {
  categories: Category[];
  poetId: number;
}

export default function CategoryList({ categories, poetId }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
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
          className="block p-4 bg-white/50 border border-white rounded-xl shadow-lg/5 dark:bg-gray-800/50 dark:border-gray-700 hover:shadow-sm transition-all duration-200 backdrop-blur-md"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {category.title}
          </h3>
          {category.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
              {category.description}
            </p>
          )}
          {category.poemCount && (
            <p className="text-gray-500 dark:text-gray-500 text-xs">
              {category.poemCount} شعر
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}
