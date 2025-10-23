import Link from 'next/link';
import Layout from '@/components/Layout';
import PoemDisplay from '@/components/PoemDisplay';
import Breadcrumbs from '@/components/Breadcrumbs';
import { ganjoorApi } from '@/lib/ganjoor-api';
import { notFound } from 'next/navigation';
import { Poem } from '@/lib/types';

interface PoemPageProps {
  params: {
    id: string;
  };
}

export default async function PoemPage({ params }: PoemPageProps) {
  const resolvedParams = await params;
  const poemId = parseInt(resolvedParams.id);
  
  if (isNaN(poemId)) {
    notFound();
  }

  let poem: Poem | null = null;
  let poetName: string = '';
  let categoryTitle: string = '';
  let error: string | null = null;

  try {
    poem = await ganjoorApi.getPoem(poemId);
    poetName = poem.poetName;
    categoryTitle = poem.categoryTitle || 'مجموعه';
  } catch (err) {
    error = err instanceof Error ? err.message : 'خطا در بارگذاری شعر';
  }

  if (error || !poem) {
    return (
      <Layout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            خطا در بارگذاری
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <Link 
            href="/"
            className="inline-block px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Breadcrumbs items={[
        { label: poetName, href: `/poet/${poem.poetId}` },
        { label: categoryTitle, href: poem.categoryId ? `/poet/${poem.poetId}/category/${poem.categoryId}` : undefined },
        { label: poem.title }
      ]} />

      <PoemDisplay poem={poem} />
    </Layout>
  );
}
