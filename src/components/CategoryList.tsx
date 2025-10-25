import Link from 'next/link';
import { Category } from '@/lib/types';
import { 
  BookOpen, 
  Scroll, 
  Heart, 
  FileText, 
  Star,
  BookMarked,
  Library,
  FileCheck
} from 'lucide-react';

interface CategoryListProps {
  categories: Category[];
  poetId: number;
  isFamous?: boolean;
}

// Function to get the appropriate icon for each category
const getCategoryIcon = (title: string) => {
  const iconMap: { [key: string]: React.ComponentType<{className?: string}> } = {
    'غزلیات': Heart,        // Ghazals - Heart for love poetry
    'قطعات': FileText,      // Qata'at - FileText for short pieces
    'رباعیات': Star,        // Rubaiyat - Star for quatrains
    'قصاید': Scroll,        // Qasidas - Scroll for odes
    'اشعار منتسب': BookMarked, // Attributed poems - BookMarked
    'مثنویات': BookOpen,    // Mathnavis - BookOpen for long poems
    'مخمسات': Library,      // Mukhammas - Library for five-line poems
    'مستزاد': FileCheck,    // Mustazad - FileCheck for extended poems
  };
  
  return iconMap[title] || BookOpen; // Default to BookOpen if not found
};

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
      {categories.map((category) => {
        const IconComponent = getCategoryIcon(category.title);
        
        return (
          <Link
            key={category.id}
            href={`/poet/${poetId}/category/${category.id}`}
            className={`flex items-center gap-3 p-4 rounded-xl shadow-lg/5 hover:shadow-sm transition-all duration-200 backdrop-blur-md ${
              isFamous 
                ? 'bg-white/80 border border-white dark:bg-orange-900/20 dark:border-orange-700/50 hover:bg-orange-100/80 hover:to-orange-100/80 dark:hover:bg-orange-800/30 dark:hover:to-orange-800/30' 
                : 'bg-white/50 border border-white dark:bg-stone-800/50 dark:border-stone-700 hover:bg-stone-100/80 hover:border-stone-300 dark:hover:bg-stone-700/30 dark:hover:border-stone-600'
            }`}
          >
            <div className={`p-2 rounded-lg ${
              isFamous 
                ? 'bg-amber-100/50 dark:bg-amber-800/30' 
                : 'bg-stone-100 dark:bg-stone-700'
            }`}>
              <IconComponent className={`w-5 h-5 ${
                isFamous 
                  ? 'text-amber-700 dark:text-amber-300' 
                  : 'text-stone-600 dark:text-stone-400'
              }`} />
            </div>
            <div className="flex flex-col gap-0">
              <h3 className={`text-lg font-semibold ${
                isFamous 
                  ? 'text-amber-900 dark:text-amber-100' 
                  : 'text-stone-900 dark:text-stone-300'
              }`}>
                {category.title}
              </h3>
            {category.poemCount !== undefined && (
              <p className="text-stone-500 dark:text-stone-300 text-xs">
                {category.poemCount} شعر
              </p>
            )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
