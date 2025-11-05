import Link from 'next/link';
import { Metadata } from 'next';
import PoemDisplay from '@/components/PoemDisplay';
import Breadcrumbs from '@/components/Breadcrumbs';
import HistoryTracker from '@/components/HistoryTracker';
import { BreadcrumbStructuredData, ArticleStructuredData } from '@/components/StructuredData';
import { hybridApi } from '@/lib/hybrid-api';
import { notFound } from 'next/navigation';
import { Poem } from '@/lib/types';

interface PoemPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PoemPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const poemId = parseInt(resolvedParams.id);
  
  if (isNaN(poemId)) {
    return {
      title: 'شعر یافت نشد',
    };
  }

  try {
    const poem = await hybridApi.getPoem(poemId);
    const firstVerse = poem.verses && poem.verses.length > 0 ? poem.verses[0] : '';
    const description = firstVerse 
      ? `${firstVerse.substring(0, 150)}...`
      : `شعر ${poem.title} از ${poem.poetName}`;
    
    const title = `${poem.title} - ${poem.poetName}`;

    return {
      title,
      description,
      keywords: [poem.title, poem.poetName, 'شعر فارسی'],
      authors: [{ name: poem.poetName }],
      openGraph: {
        title: `${title} | دفتر گنج`,
        description,
        type: 'article',
        images: [
          {
            url: 'https://ganj.directory/og-image.jpg',
            width: 1200,
            height: 675,
            alt: title,
          },
        ],
        url: `https://ganj.directory/poem/${poem.id}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | دفتر گنج`,
        description,
        images: ['https://ganj.directory/og-image.jpg'],
      },
      alternates: {
        canonical: `/poem/${poem.id}`,
      },
    };
  } catch (error) {
    return {
      title: 'شعر یافت نشد',
    };
  }
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

  const breadcrumbItems = [
    { name: poetName, url: `https://ganj.directory/poet/${poem.poetId}` },
    ...(poem.categoryId ? [{ name: categoryTitle, url: `https://ganj.directory/poet/${poem.poetId}/category/${poem.categoryId}` }] : []),
    { name: poem.title, url: `https://ganj.directory/poem/${poem.id}` },
  ];

  const firstVerse = poem.verses && poem.verses.length > 0 ? poem.verses[0] : '';
  const articleDescription = firstVerse || `${poem.title} از ${poem.poetName}`;

  return (
    <>
      <BreadcrumbStructuredData items={breadcrumbItems} />
      <ArticleStructuredData
        headline={poem.title}
        description={articleDescription}
        author={{ name: poem.poetName }}
        url={`https://ganj.directory/poem/${poem.id}`}
        image="https://ganj.directory/og-image.jpg"
      />
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
