import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import CategoryList from '@/components/CategoryList';
import Breadcrumbs from '@/components/Breadcrumbs';
import ExpandableDescription from '@/components/ExpandableDescription';
import { PoetPageSkeleton } from '@/components/LoadingStates';
import { ganjoorApi } from '@/lib/ganjoor-api';
import { notFound } from 'next/navigation';
import { Poet, Category } from '@/lib/types';

// Helper function to get poet image based on slug
const getPoetImage = (slug: string) => {
  const imageMap: { [key: string]: string } = {
    'hafez': 'hafez@2x.webp',
    'saadi': 'saadi@2x.webp',
    'moulavi': 'molana@2x.webp',
    'ferdousi': 'ferdowsi@2x.webp',
    'attar': 'attar@2x.webp',
    'nezami': 'nezami@2x.webp'
  };
  return imageMap[slug?.toLowerCase() || ''] || null;
};

// Helper function to check if poet is famous
const isFamousPoet = (slug: string) => {
  const famousSlugs = ['hafez', 'saadi', 'moulavi', 'ferdousi', 'attar', 'nezami'];
  return famousSlugs.includes(slug?.toLowerCase() || '');
};

interface PoetPageProps {
  params: {
    id: string;
  };
}

export default async function PoetPage({ params }: PoetPageProps) {
  const resolvedParams = await params;
  const poetId = parseInt(resolvedParams.id);
  
  if (isNaN(poetId)) {
    notFound();
  }

  let poet: Poet | null = null;
  let categories: Category[] = [];
  let error: string | null = null;

  try {
    const result = await ganjoorApi.getPoet(poetId);
    poet = result.poet;
    categories = result.categories;
  } catch (err) {
    error = err instanceof Error ? err.message : 'خطا در بارگذاری شاعر';
  }

  if (error || !poet) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-300 mb-4">
          خطا در بارگذاری
        </h1>
        <p className="text-stone-600 dark:text-stone-300 mb-4">
          {error}
        </p>
        <Link 
          href="/"
          className="inline-block px-4 py-2 bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-300 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-800 transition-colors"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    );
  }

  const isFamous = isFamousPoet(poet.slug || '');

  return (
    <Suspense fallback={<PoetPageSkeleton />}>
      <Breadcrumbs items={[{ label: poet.name }]} />
      
       <div className={`mb-8 border rounded-2xl shadow-2xl/5 backdrop-blur-md ${
         isFamous 
           ? 'bg-white/80 border-white dark:bg-yellow-950/20 dark:border-yellow-900/50 backdrop-blur-md' 
           : 'bg-white/50 border-white dark:bg-yellow-950/80 dark:border-yellow-900/50 backdrop-blur-md'
       }`}>
       
         <div className="text-right">
            <div className={`flex flex-col md:flex-row items-center md:items-stretch justify-start relative ${
              isFamous 
                ? 'border-b border-yellow-900/50' 
                : 'bg-stone-200/50 dark:bg-stone-900 border-b border-stone-200 dark:border-yellow-900/50 backdrop-blur-md'
            }`}>
            {/* Poet Image - only for famous poets */}
             {getPoetImage(poet.slug || '') && (
                 <div className={`relative w-[140px] h-[140px] md:w-[160px] md:h-[160px] border-none md:border-l border-yellow-900/50 p-4 ${
                   isFamous 
                    //  ? 'bg-gradient-to-br from-amber-200 to-orange-200 dark:from-amber-700 dark:to-orange-700 ring-4 ring-amber-200/50 dark:ring-amber-600/50' 
                    //  : 'bg-stone-300 dark:bg-stone-600'
                 }`}>
                   <Image
                     src={`/images/${getPoetImage(poet.slug || '')}`}
                     alt={`تصویر ${poet.name}`}
                     width={160}
                     height={160}
                     className="w-full h-full rounded-2xl dark:brightness-90 contrast-100 hover:brightness-100 hover:contrast-100"
                     priority
                   />
                 </div>
               )}
              <div className={`flex items-center gap-6 flex-row-reverse p-4 ${
                isFamous ? 'p-4' : 'p-4'
              }`}>
                <div className="flex flex-col gap-2 align-center md:align-start text-center md:text-right">
                  <h1 className={`font-doran text-2xl md:text-4xl font-black ${
                    isFamous 
                      ? 'text-amber-900 dark:text-yellow-100' 
                      : 'text-stone-900 dark:text-stone-300'
                  }`}>
                    {poet.name}
                  </h1>
                  
                  {(poet.birthYear || poet.deathYear) && (
                    <p className={`text-xl md:text-2xl font-normal ${
                      isFamous 
                        ? 'text-amber-700 dark:text-yellow-700' 
                        : 'text-stone-600 dark:text-stone-300'
                    }`}>
                      {poet.birthYear && poet.deathYear 
                        ? `${poet.birthYear} - ${poet.deathYear}`
                        : poet.birthYear || poet.deathYear
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>
          
           {poet.description && (
             <ExpandableDescription 
               description={poet.description} 
               isFamous={isFamous}
               maxLength={300}
             />
           )}
        </div>
      </div>

      <div>
        <h2 className={`font-doran text-2xl font-semibold mb-6 text-right ${
          isFamous 
            ? 'text-amber-900 dark:text-amber-100' 
            : 'text-stone-900 dark:text-stone-300'
        }`}>
          مجموعه‌ها
        </h2>
        <CategoryList categories={categories} poetId={poetId} isFamous={isFamous} />
      </div>
    </Suspense>
  );
}
