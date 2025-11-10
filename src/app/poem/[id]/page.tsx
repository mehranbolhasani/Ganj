import Link from 'next/link';
import PoemDisplay from '@/components/PoemDisplay';
import PoemNavigation from '@/components/PoemNavigation';
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
  let previousPoem: Poem | null = null;
  let nextPoem: Poem | null = null;

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

    // Fetch poems from the same category/chapter for navigation
    if (poem.categoryId) {
      try {
        let poems: Poem[] = [];
        
        // If poem belongs to a chapter, fetch poems from that chapter
        // Otherwise, fetch from the category
        if (poem.chapterId) {
          const chapterData = await hybridApi.getChapter(poem.poetId, poem.categoryId, poem.chapterId);
          poems = chapterData.poems;
        } else {
          poems = await hybridApi.getCategoryPoems(poem.poetId, poem.categoryId);
        }
        
        // Find current poem index
        const currentIndex = poems.findIndex(p => p.id === poemId);
        
        if (currentIndex !== -1) {
          // Get previous poem
          if (currentIndex > 0) {
            previousPoem = poems[currentIndex - 1];
          }
          
          // Get next poem
          if (currentIndex < poems.length - 1) {
            nextPoem = poems[currentIndex + 1];
          }
        }
      } catch (navError) {
        // If navigation fails, just continue without it
        console.warn('Failed to load navigation poems:', navError);
      }
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
      
      <div className="max-w-4xl mx-auto w-full">
        <PoemNavigation 
          currentPoem={poem}
          previousPoem={previousPoem}
          nextPoem={nextPoem}
        />
      </div>
    </>
  );
}
