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

interface CardEntry {
  key: string;
  title: string;
  poemCount?: number;
  href: string;
}

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

  const cards: CardEntry[] = [];

  for (const category of categories) {
    if (category.hasChapters && Array.isArray(category.chapters) && category.chapters.length > 0) {
      for (const chapter of category.chapters) {
        cards.push({
          key: `chapter-${chapter.id}`,
          title: chapter.title,
          poemCount: chapter.poemCount,
          href: `/poet/${poetId}/category/${chapter.categoryId}/chapter/${chapter.id}`,
        });
      }
    } else {
      cards.push({
        key: `category-${category.id}`,
        title: category.title,
        poemCount: category.poemCount,
        href: `/poet/${poetId}/category/${category.id}`,
      });
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
      {cards.map((card) => {
        const IconComponent = getCategoryIcon(card.title);

        return (
          <Link
            key={card.key}
            href={card.href}
            className={`flex items-center gap-3 p-4 rounded-xl shadow-xl shadow-primary/10 dark:shadow-none transition-all duration-200 backdrop-blur-md ${styles.card}`}
          >
            <div className={`p-2 rounded-lg ${styles.iconWrapper}`}>
              <HugeiconsIcon icon={IconComponent} size={20} className={`w-5 h-5 ${styles.icon}`} />
            </div>
            <div className="flex flex-col gap-0">
              <h3 className={`text-lg font-semibold ${styles.title}`}>
                {card.title}
              </h3>
              {card.poemCount !== undefined && (
                <p className="text-muted-foreground dark:text-secondary-foreground text-xs">
                  {toPersianDigits(card.poemCount)} شعر
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
