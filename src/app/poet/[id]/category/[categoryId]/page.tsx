import Link from 'next/link';
import { Suspense } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import ChapterList from '@/components/ChapterList';
import PoemPagination from '@/components/PoemPagination';
import { CategoryPageSkeleton } from '@/components/LoadingStates';
import { ganjoorApi } from '@/lib/ganjoor-api';
import { notFound } from 'next/navigation';
import { Poem, Category } from '@/lib/types';

interface CategoryPoemsPageProps {
  params: {
    id: string;
    categoryId: string;
  };
  searchParams: {
    page?: string;
  };
}

export default async function CategoryPoemsPage({ params, searchParams }: CategoryPoemsPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const poetId = parseInt(resolvedParams.id);
  const categoryId = parseInt(resolvedParams.categoryId);
  const currentPage = parseInt(resolvedSearchParams.page || '1');
  
  if (isNaN(poetId) || isNaN(categoryId)) {
    notFound();
  }

  let poems: Poem[] = [];
  let poetName: string = '';
  let categoryTitle: string = '';
  let category: Category | undefined;
  let error: string | null = null;

  try {
    poems = await ganjoorApi.getCategoryPoems(poetId, categoryId);
    // Get poet name and category title for breadcrumbs
    const poetData = await ganjoorApi.getPoet(poetId);
    poetName = poetData.poet.name;
    category = poetData.categories.find(cat => cat.id === categoryId);
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
            href={`/poet/${poetId}`}
            className="inline-block px-4 py-2 bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-300 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-800 transition-colors"
          >
            بازگشت به شاعر
          </Link>
        </div>
      
    );
  }

  return (
    <Suspense fallback={<CategoryPageSkeleton />}>
      <Breadcrumbs items={[
        { label: poetName, href: `/poet/${poetId}` },
        { label: categoryTitle }
      ]} />
      
       <div className="">
         <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-300 text-right flex items-center justify-between">
           <span>{categoryTitle}</span>
           <span className="text-stone-600 dark:text-stone-300">
             {poems.length}
           </span>
         </h1>
       </div>

       {/* Show chapters if available */}
       {category?.chapters && category.chapters.length > 0 && (
         <ChapterList 
           chapters={category.chapters} 
           categoryTitle={categoryTitle}
           poetId={poetId}
           categoryId={categoryId}
         />
       )}

      {/* Show poems only if there are no chapters, or if there are direct poems */}
      {category?.chapters && category.chapters.length > 0 ? (
        <div className="text-center py-8">
          <p className="text-stone-600 dark:text-stone-400 text-right mb-4">
            برای مشاهده اشعار، روی یکی از فصول بالا کلیک کنید
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-500 text-right">
            این مجموعه شامل {category.chapters.length} فصل است
          </p>
        </div>
      ) : poems.length === 0 ? (
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
          baseUrl={`/poet/${poetId}/category/${categoryId}`}
        />
      )}
    </Suspense>
  );
}
