import Link from 'next/link';
import { Suspense } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import ChapterList from '@/components/ChapterList';
import PoemPagination from '@/components/PoemPagination';
import GanjoorOutageCard from '@/components/GanjoorOutageCard';
import { CategoryPageSkeleton } from '@/components/LoadingStates';
import { hybridApi } from '@/lib/hybrid-api';
import { GanjoorUnavailableError } from '@/lib/ganjoor-api';
import { notFound, redirect } from 'next/navigation';
import { Poem, Category } from '@/lib/types';
import { toPersianDigits } from '@/lib/persian-digits';

export const revalidate = 3600; // revalidate category pages at most once per hour

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
  let ganjoorUnavailable = false;
  let migratedPoet = false;
  let shouldRedirect = false;

  try {
    poems = await hybridApi.getCategoryPoems(poetId, categoryId);
    // Get poet name and category title for breadcrumbs
    const poetData = await hybridApi.getPoet(poetId);
    poetName = poetData.poet.name;
    category = poetData.categories.find(cat => cat.id === categoryId);
    categoryTitle = category?.title || 'مجموعه';
    const isContainer = Boolean(category?.hasChapters && category.chapters && category.chapters.length > 0);
    if (isContainer) {
      shouldRedirect = true;
    }
  } catch (err) {
    if (err instanceof GanjoorUnavailableError) {
      ganjoorUnavailable = true;
      migratedPoet = await hybridApi.isPoetMigrated(poetId);
    }
    error = err instanceof Error ? err.message : 'خطا در بارگذاری اشعار';
  }

  if (shouldRedirect) {
    redirect(`/poet/${poetId}`);
  }

  if (ganjoorUnavailable && !migratedPoet) {
    return (
      <GanjoorOutageCard
        backHref={`/poet/${poetId}`}
        backLabel="بازگشت به شاعر"
      />
    );
  }

  if (error) {
    return (

        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            خطا در بارگذاری
          </h1>
          <p className="text-muted-foreground dark:text-secondary-foreground mb-4">
            {error}
          </p>
          <Link
            href={`/poet/${poetId}`}
            className="inline-block px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted dark:hover:bg-primary transition-colors"
          >
            بازگشت به شاعر
          </Link>
        </div>

    );
  }
  const effectiveChapters = category?.chapters ?? [];
  return (
    <Suspense fallback={<CategoryPageSkeleton />}>
      <div className="min-h-fit bg-primary/5 p-6 rounded-3xl flex flex-col gap-4">
        <Breadcrumbs items={[{ label: poetName, href: `/poet/${poetId}` }, { label: categoryTitle }]} />

        <div className="h-20 flex items-center">
          <h1 className="text-3xl font-bold text-right flex items-center justify-between w-full">
            <span>{categoryTitle}</span>
            <span className="text-muted-foreground dark:text-secondary-foreground">{toPersianDigits(poems.length)}</span>
          </h1>
        </div>

        {/* Show chapters if available */}
        {effectiveChapters.length > 0 && (
          <ChapterList chapters={effectiveChapters} categoryTitle={categoryTitle} poetId={poetId} categoryId={categoryId} />
        )}

        {/* Show poems only if there are no chapters, or if there are direct poems */}
        {effectiveChapters.length > 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-right mb-4">برای مشاهده اشعار، روی یکی از فصول بالا کلیک کنید</p>
            <p className="text-sm text-muted-foreground text-right">این مجموعه شامل {toPersianDigits(effectiveChapters.length)} فصل است</p>
          </div>
        ) : poems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground dark:text-secondary-foreground text-right">هیچ شعری یافت نشد</p>
          </div>
        ) : (
          <PoemPagination poems={poems} itemsPerPage={20} currentPage={currentPage} baseUrl={`/poet/${poetId}/category/${categoryId}`} />
        )}
      </div>
    </Suspense>
  );
}
