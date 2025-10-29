import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import PoemPagination from '@/components/PoemPagination';
import { ganjoorApi } from '@/lib/ganjoor-api';
import { notFound } from 'next/navigation';
import { Poem, Category } from '@/lib/types';

interface ChapterPoemsPageProps {
  params: {
    id: string;
    categoryId: string;
    chapterId: string;
  };
  searchParams: {
    page?: string;
  };
}

export default async function ChapterPoemsPage({ params, searchParams }: ChapterPoemsPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const poetId = parseInt(resolvedParams.id);
  const categoryId = parseInt(resolvedParams.categoryId);
  const chapterId = parseInt(resolvedParams.chapterId);
  const currentPage = parseInt(resolvedSearchParams.page || '1');
  
  if (isNaN(poetId) || isNaN(categoryId) || isNaN(chapterId)) {
    notFound();
  }

  let poems: Poem[] = [];
  let poetName: string = '';
  let categoryTitle: string = '';
  let chapterTitle: string = '';
  let error: string | null = null;

  try {
    // Get chapter details and poems
    const chapterData = await ganjoorApi.getChapter(poetId, categoryId, chapterId);
    poems = chapterData.poems;
    chapterTitle = chapterData.chapter.title;
    
    // Get poet and category info for breadcrumbs
    const poetData = await ganjoorApi.getPoet(poetId);
    poetName = poetData.poet.name;
    const category = poetData.categories.find(cat => cat.id === categoryId);
    categoryTitle = category?.title || 'مجموعه';
  } catch (err) {
    error = err instanceof Error ? err.message : 'خطا در بارگذاری اشعار';
  }

  if (error) {
    return (
      
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-300 mb-4">
            خطا در بارگذاری
          </h1>
          <p className="text-stone-600 dark:text-stone-300 mb-4">
            {error}
          </p>
          <Link 
            href={`/poet/${poetId}/category/${categoryId}`}
            className="inline-block px-4 py-2 bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-300 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-800 transition-colors"
          >
            بازگشت به {categoryTitle}
          </Link>
        </div>
      
    );
  }

  return (
    <>
      <Breadcrumbs items={[
        { label: poetName, href: `/poet/${poetId}` },
        { label: categoryTitle, href: `/poet/${poetId}/category/${categoryId}` },
        { label: chapterTitle }
      ]} />
      
      <div className="">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-300 text-right flex items-center justify-between">
          <span>{chapterTitle}</span>
          <span className="text-stone-600 dark:text-stone-300">
            {poems.length}
          </span>
        </h1>
        <p className="text-stone-600 dark:text-stone-400 text-right mt-2">
          از {categoryTitle} • {poetName}
        </p>
      </div>

      {poems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-stone-500 dark:text-stone-300 text-right">
            هیچ شعری یافت نشد
          </p>
        </div>
      ) : (
        <PoemPagination
          poems={poems}
          itemsPerPage={20}
          currentPage={currentPage}
          baseUrl={`/poet/${poetId}/category/${categoryId}/chapter/${chapterId}`}
        />
      )}
    </>
  );
}
