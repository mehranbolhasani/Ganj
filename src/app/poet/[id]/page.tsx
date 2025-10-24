import Link from 'next/link';
import Image from 'next/image';
import Layout from '@/components/Layout';
import CategoryList from '@/components/CategoryList';
import Breadcrumbs from '@/components/Breadcrumbs';
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

  return (
    <Layout>
      <Breadcrumbs items={[{ label: poet.name }]} />
      
       <div className="mb-16 bg-white/50 border border-white rounded-2xl shadow-lg/5 dark:bg-stone-800/50 dark:border-stone-700 overflow-hidden backdrop-blur-md">
       
         <div className="text-right">
           <div className="flex gap-4 items-center justify-between p-16 bg-stone-200/50 dark:bg-stone-700/50">
             <div className="flex items-center gap-6 flex-row-reverse">
               {/* Poet Image - only for famous poets */}
               {getPoetImage(poet.slug || '') && (
                 <div className="w-24 h-24 rounded-full overflow-hidden bg-stone-300 dark:bg-stone-600 flex-shrink-0">
                   <Image
                     src={`/images/${getPoetImage(poet.slug || '')}`}
                     alt={`تصویر ${poet.name}`}
                     width={96}
                     height={96}
                     className="w-full h-full object-cover"
                     priority
                   />
                 </div>
               )}
               
               <div className="flex flex-col gap-2">
                 <h1 className="font-doran text-4xl font-black text-stone-900 dark:text-stone-300">
                   {poet.name}
                 </h1>
                 
                 {(poet.birthYear || poet.deathYear) && (
                   <p className="text-stone-600 dark:text-stone-300 text-2xl font-normal">
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
             <p className="text-md text-stone-700 dark:text-stone-300 max-w-3xl mx-auto p-8 leading-relaxed">
               {poet.description}
             </p>
           )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-300 mb-6 text-center">
          مجموعه‌ها
        </h2>
        <CategoryList categories={categories} poetId={poetId} />
      </div>
    </Layout>
  );
}
