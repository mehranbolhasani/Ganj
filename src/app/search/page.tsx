import { Suspense } from 'react';
import SearchResults from '@/components/SearchResults';
import { SearchResultSkeleton } from '@/components/LoadingStates';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: 'all' | 'poets' | 'categories' | 'poems';
    page?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || '';
  const type = params.type || 'all';
  const page = parseInt(params.page || '1');

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-4">
          نتایج جستجو
          {query && (
            <span className="text-stone-600 dark:text-stone-400 font-normal">
              {' '}برای &quot;{query}&quot;
            </span>
          )}
        </h1>
      </div>

      {query ? (
        <Suspense fallback={<SearchResultSkeleton />}>
          <SearchResults query={query} type={type} page={page} />
        </Suspense>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-stone-100 dark:bg-stone-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-stone-700 dark:text-stone-300 mb-2">
            جستجو کنید
          </h3>
          <p className="text-stone-500 dark:text-stone-400">
            برای شروع جستجو، کلمه یا عبارتی را وارد کنید
          </p>
        </div>
      )}
    </div>
  );
}
