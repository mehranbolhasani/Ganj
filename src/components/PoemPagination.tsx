import { Poem } from '@/lib/types';
import Link from 'next/link';

interface PoemPaginationProps {
  poems: Poem[];
  itemsPerPage?: number;
  currentPage?: number;
  baseUrl: string;
}

export default function PoemPagination({ 
  poems, 
  itemsPerPage = 20, 
  currentPage = 1,
  baseUrl
}: PoemPaginationProps) {
  const totalPages = Math.ceil(poems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  const currentPoems = poems.slice(startIndex, endIndex);
  
  const generatePageUrl = (page: number) => {
    return `${baseUrl}?page=${page}`;
  };
  
  if (poems.length === 0) {
    return null;
  }
  
  if (totalPages <= 1) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
        {poems.map((poem) => (
          <Link
            key={poem.id}
            href={`/poem/${poem.id}`}
            className="block p-4 sm:p-6 bg-white/50 border border-white rounded-2xl shadow-lg/5 dark:bg-stone-800/50 dark:border-stone-700 hover:border-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700/30 dark:hover:border-stone-600 active:scale-[0.98] transition-all duration-200 touch-manipulation"
          >
            <h3 className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-300 mb-3 text-right leading-tight">
              {poem.title}
            </h3>
            <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base text-right flex items-center justify-start gap-2">
              <span className="font-medium">{poem.poetName}</span>
              {poem.chapterTitle && (
                <span className="block text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                  {poem.chapterTitle}
                </span>
              )}
            </p>
          </Link>
        ))}
      </div>
    );
  }
  
  return (
    <div>
      {/* Poems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 mb-12">
        {currentPoems.map((poem) => (
          <Link
            key={poem.id}
            href={`/poem/${poem.id}`}
            className="block p-4 sm:p-6 bg-white/50 border border-white rounded-2xl shadow-lg/5 dark:bg-stone-800/50 dark:border-stone-700 hover:border-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700/30 dark:hover:border-stone-600 active:scale-[0.98] transition-all duration-200 touch-manipulation"
          >
            <h3 className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-300 mb-3 text-right leading-tight">
              {poem.title}
            </h3>
            <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base text-right flex items-center justify-start gap-2">
              <span className="font-medium">{poem.poetName}</span>
              {poem.chapterTitle && (
                <span className="block text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                  {poem.chapterTitle}
                </span>
              )}
            </p>
          </Link>
        ))}
      </div>
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 text-sm mb-4">
        {currentPage > 1 && (
          <Link
            href={generatePageUrl(currentPage - 1)}
            className="px-4 py-2 sm:px-6 sm:py-3 rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600 active:bg-stone-400 dark:active:bg-stone-500 transition-colors touch-manipulation font-medium"
          >
            قبلی
          </Link>
        )}
        
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <Link
                key={pageNum}
                href={generatePageUrl(pageNum)}
                className={`px-3 py-2 sm:px-4 sm:py-3 rounded-lg transition-colors touch-manipulation font-medium ${
                  currentPage === pageNum
                    ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 active:bg-stone-300 dark:active:bg-stone-600'
                }`}
              >
                {pageNum}
              </Link>
            );
          })}
        </div>
        
        {currentPage < totalPages && (
          <Link
            href={generatePageUrl(currentPage + 1)}
            className="px-4 py-2 sm:px-6 sm:py-3 rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600 active:bg-stone-400 dark:active:bg-stone-500 transition-colors touch-manipulation font-medium"
          >
            بعدی
          </Link>
        )}
      </div>
      
      {/* Page Info */}
      <div className="text-center text-sm text-stone-500 dark:text-stone-400 mt-2">
        صفحه {currentPage} از {totalPages} • {poems.length} شعر
      </div>
    </div>
  );
}
