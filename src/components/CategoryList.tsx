import Link from 'next/link';
import { Category } from '@/lib/types';
import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { BookBookmark01Icon, BookOpen01Icon, File02Icon, FileCheckIcon, HeartIcon, LibraryIcon, ScrollIcon, StarIcon } from '@hugeicons/core-free-icons';
import { toPersianDigits } from '@/lib/persian-digits';

interface CategoryListProps {
  categories: Category[];
  poetId: number;
  isFamous?: boolean;
}

// Function to get the appropriate icon for each category
import type { IconSvgElement } from '@hugeicons/react';

const getCategoryIcon = (title: string) => {
  const iconMap: { [key: string]: IconSvgElement } = {
    'غزلیات': HeartIcon,        // Ghazals - Heart for love poetry
    'قطعات': File02Icon,      // Qata'at - FileText for short pieces
    'رباعیات': StarIcon,        // Rubaiyat - Star for quatrains
    'قصاید': ScrollIcon,        // Qasidas - Scroll for odes
    'اشعار منتسب': BookBookmark01Icon, // Attributed poems - BookMarked
    'مثنویات': BookOpen01Icon,    // Mathnavis - BookOpen for long poems
    'مخمسات': LibraryIcon,      // Mukhammas - Library for five-line poems
    'مستزاد': FileCheckIcon,    // Mustazad - FileCheck for extended poems
  };

  return iconMap[title] || BookOpen01Icon; // Default to BookOpen if not found
};

function CategoryList({ categories, poetId, isFamous = false }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground dark:text-secondary-foreground">
          هیچ مجموعه‌ای یافت نشد
        </p>
      </div>
    );
  }

  const styles = isFamous
    ? {
        card: 'bg-card hover:shadow-primary/20',
        iconWrapper: 'bg-warning/10',
        icon: 'text-secondary-foreground',
        title: 'text-foreground',
      }
    : {
        card: 'bg-card hover:shadow-primary/20',
        iconWrapper: 'bg-muted dark:bg-secondary',
        icon: 'text-muted-foreground',
        title: 'text-foreground',
      };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
      {categories.map((category) => {
        const IconComponent = getCategoryIcon(category.title);

        return (
          <Link
            key={category.id}
            href={`/poet/${poetId}/category/${category.id}`}
            className={`flex items-center gap-3 p-4 rounded-xl shadow-xl shadow-primary/10 dark:shadow-none transition-all duration-200 backdrop-blur-md ${styles.card}`}
          >
            <div className={`p-2 rounded-lg ${styles.iconWrapper}`}>
              <HugeiconsIcon icon={IconComponent} size={20} className={`w-5 h-5 ${styles.icon}`} />
            </div>
            <div className="flex flex-col gap-0">
              <h3 className={`text-lg font-semibold ${styles.title}`}>
                {category.title}
              </h3>
            {category.poemCount !== undefined && (
              <p className="text-muted-foreground dark:text-secondary-foreground text-xs">
                {toPersianDigits(category.poemCount)} شعر
              </p>
            )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default React.memo(CategoryList);
