import Link from 'next/link';
import Image from 'next/image';
import Layout from '@/components/Layout';
import CategoryList from '@/components/CategoryList';
import Breadcrumbs from '@/components/Breadcrumbs';
import ExpandableDescription from '@/components/ExpandableDescription';
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
      <Layout>
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
      </Layout>
    );
  }

  const isFamous = isFamousPoet(poet.slug || '');

  return (
    <Layout>
      <Breadcrumbs items={[{ label: poet.name }]} />
      
       <div className={`mb-8 border rounded-2xl shadow-2xl/5 backdrop-blur-md ${
         isFamous 
           ? 'bg-white/80 border-white dark:bg-orange-900/20 dark:border-amber-700/50' 
           : 'bg-white/50 border-white dark:bg-stone-800/50 dark:border-stone-700'
       }`}>
       
         <div className="text-right p-1">
            <div className={`flex flex-col md:flex-row gap-4 items-center justify-between p-16 relative rounded-t-xl ${
              isFamous 
                ? 'bg-orange-100/10 dark:bg-orange-900 border-b border-orange-200 dark:border-orange-700' 
                : 'bg-stone-200/50 dark:bg-stone-700/50'
            }`}>
            {/* Poet Image - only for famous poets */}
             {getPoetImage(poet.slug || '') && (
                 <div className={`absolute right-[50%] translate-x-[50%] -top-16 md:right-0 md:top-[50%] md:translate-y-[-50%] w-[160px] h-[160px] rounded-2xl overflow-hidden shadow-xl ${
                   isFamous 
                    //  ? 'bg-gradient-to-br from-amber-200 to-orange-200 dark:from-amber-700 dark:to-orange-700 ring-4 ring-amber-200/50 dark:ring-amber-600/50' 
                    //  : 'bg-stone-300 dark:bg-stone-600'
                 }`}>
                   <Image
                     src={`/images/${getPoetImage(poet.slug || '')}`}
                     alt={`تصویر ${poet.name}`}
                     width={160}
                     height={160}
                     className="w-full h-full object-cover"
                     priority
                   />
                 </div>
               )}
              <div className={`flex items-center gap-6 flex-row-reverse pt-16 md:pt-0 ${
                isFamous ? 'pr-0 md:pr-16 translate-y-2' : 'pr-0 md:pr-0 translate-y-0'
              }`}>
                <div className="flex flex-col gap-2 align-center md:align-start text-center md:text-right">
                  <h1 className={`font-doran text-4xl font-black ${
                    isFamous 
                      ? 'text-amber-900 dark:text-amber-100' 
                      : 'text-stone-900 dark:text-stone-300'
                  }`}>
                    {poet.name}
                  </h1>
                  
                  {(poet.birthYear || poet.deathYear) && (
                    <p className={`text-2xl font-normal ${
                      isFamous 
                        ? 'text-amber-700 dark:text-amber-300' 
                        : 'text-stone-600 dark:text-stone-300'
                    }`}>
                      {poet.birthYear && poet.deathYear 
                        ? `${poet.birthYear} - ${poet.deathYear}`
                        : poet.birthYear || poet.deathYear
                      }
                    </p>
                  )}
                  
                  {/* Special badge for famous poets */}
                  {isFamous && (
                    <div className="inline-flex items-center gap-2 mt-2 justify-center md:justify-start">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-800/30 px-3 py-1 rounded-full">
                        شاعر برجسته
                      </span>
                    </div>
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
    </Layout>
  );
}
