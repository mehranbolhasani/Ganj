import Link from 'next/link';
import PoemDisplay from '@/components/PoemDisplay';
import Breadcrumbs from '@/components/Breadcrumbs';
import HistoryTracker from '@/components/HistoryTracker';
import { hybridApi } from '@/lib/hybrid-api';
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
    poem = await hybridApi.getPoem(poemId);
    poetName = poem.poetName;
    categoryTitle = poem.categoryTitle || 'مجموعه';
    
    // Debug: Log poem data in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PoemPage] Loaded poem ${poemId}:`, {
        title: poem.title,
        poetName: poem.poetName,
        versesCount: poem.verses?.length || 0,
        hasVerses: !!(poem.verses && poem.verses.length > 0),
      });
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'خطا در بارگذاری شعر';
    console.error(`[PoemPage] Error loading poem ${poemId}:`, err);
  }

  if (error || !poem) {
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

  return (
    <>
      <HistoryTracker poem={poem} />
      
      <Breadcrumbs items={[
        { label: poetName, href: `/poet/${poem.poetId}` },
        { label: categoryTitle, href: poem.categoryId ? `/poet/${poem.poetId}/category/${poem.categoryId}` : undefined },
        { label: poem.title }
      ]} />

      <PoemDisplay poem={poem} />
    </>
  );
}
