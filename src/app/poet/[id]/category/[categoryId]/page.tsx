import Link from 'next/link';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { ganjoorApi } from '@/lib/ganjoor-api';
import { notFound } from 'next/navigation';
import { Poem } from '@/lib/types';

interface CategoryPoemsPageProps {
  params: {
    id: string;
    categoryId: string;
  };
}

export default async function CategoryPoemsPage({ params }: CategoryPoemsPageProps) {
  const resolvedParams = await params;
  const poetId = parseInt(resolvedParams.id);
  const categoryId = parseInt(resolvedParams.categoryId);
  
  if (isNaN(poetId) || isNaN(categoryId)) {
    notFound();
  }

  let poems: Poem[] = [];
  let poetName: string = '';
  let categoryTitle: string = '';
  let error: string | null = null;

  try {
    poems = await ganjoorApi.getCategoryPoems(poetId, categoryId);
    // Get poet name and category title for breadcrumbs
    const poetData = await ganjoorApi.getPoet(poetId);
    poetName = poetData.poet.name;
    const category = poetData.categories.find(cat => cat.id === categoryId);
    categoryTitle = category?.title || 'مجموعه';
  } catch (err) {
    error = err instanceof Error ? err.message : 'خطا در بارگذاری اشعار';
  }

  if (error) {
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
            href={`/poet/${poetId}`}
            className="inline-block px-4 py-2 bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-300 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-800 transition-colors"
          >
            بازگشت به شاعر
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
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

      {poems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-stone-500 dark:text-stone-300 text-right">
            هیچ شعری یافت نشد
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {poems.map((poem) => (
            <Link
              key={poem.id}
              href={`/poem/${poem.id}`}
              className="block p-4 bg-white/50 border border-white rounded-2xl shadow-lg/5 dark:bg-stone-800/80 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600"
            >
              <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-300 mb-2 text-right">
                {poem.title}
              </h3>
              <p className="text-stone-600 dark:text-stone-300 text-sm text-right">
                {poem.poetName}
              </p>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
