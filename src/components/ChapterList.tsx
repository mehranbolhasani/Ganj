import Link from 'next/link';
import { Chapter } from '@/lib/types';
import { toPersianDigits } from '@/lib/persian-digits';

interface ChapterListProps {
  chapters: Chapter[];
  categoryTitle: string;
  poetId: number;
  categoryId: number;
}

export default function ChapterList({ chapters, categoryTitle, poetId, categoryId }: ChapterListProps) {
  if (!chapters || chapters.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-300 mb-4 text-right">
        فصول {categoryTitle}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {chapters.map((chapter) => (
          <Link
            key={chapter.id}
            href={`/poet/${poetId}/category/${categoryId}/chapter/${chapter.id}`}
            className="block p-4 bg-card rounded-xl shadow-xl shadow-primary/10 dark:shadow-none transition-all duration-200"
          >
            <h4 className="text-base font-medium text-stone-900 dark:text-stone-300 mb-2 text-right">
              {chapter.title}
            </h4>
            {chapter.poemCount && chapter.poemCount > 0 && (
              <p className="text-sm text-stone-600 dark:text-stone-400 text-right">
                {toPersianDigits(chapter.poemCount)} شعر
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
