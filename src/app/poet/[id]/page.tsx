import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { Metadata } from "next";
import CategoryList from "@/components/CategoryList";
import Breadcrumbs from "@/components/Breadcrumbs";
import ExpandableDescription from "@/components/ExpandableDescription";
import PoetSearch from "@/components/PoetSearch";
import GanjoorOutageCard from "@/components/GanjoorOutageCard";
import { PoetPageSkeleton } from "@/components/LoadingStates";
import { hybridApi } from "@/lib/hybrid-api";
import { GanjoorUnavailableError } from "@/lib/ganjoor-api";
import { notFound } from "next/navigation";
import { Poet, Category } from "@/lib/types";
import { BreadcrumbStructuredData, PersonStructuredData } from "@/components/StructuredData";
import { toPersianDigits } from "@/lib/persian-digits";

// Helper function to get poet image based on slug
const getPoetImage = (slug: string) => {
  const imageMap: { [key: string]: string } = {
    hafez: "hafez@2x.webp",
    saadi: "saadi@2x.webp",
    moulavi: "molana@2x.webp",
    ferdousi: "ferdowsi@2x.webp",
    attar: "attar@2x.webp",
    nezami: "nezami@2x.webp",
  };
  return imageMap[slug?.toLowerCase() || ""] || null;
};

// Helper function to check if poet is famous
const isFamousPoet = (slug: string) => {
  const famousSlugs = ["hafez", "saadi", "moulavi", "ferdousi", "attar", "nezami"];
  return famousSlugs.includes(slug?.toLowerCase() || "");
};

interface PoetPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PoetPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const poetId = parseInt(resolvedParams.id);

  if (isNaN(poetId)) {
    return {
      title: "شاعر یافت نشد",
    };
  }

  try {
    const result = await hybridApi.getPoet(poetId);
    const poet = result.poet;
    const categories = result.categories;
    const totalPoems = categories.reduce((sum, cat) => sum + (cat.poemCount || 0), 0);

    const description = poet.description
      ? `${poet.description.substring(0, 150)}...`
      : `اشعار ${poet.name} - ${toPersianDigits(totalPoems)} شعر در ${toPersianDigits(categories.length)} دسته‌بندی`;

    const poetImage = getPoetImage(poet.slug || "");
    const ogImage = poetImage ? `https://ganj.directory/images/${poetImage}` : "https://ganj.directory/og-image.jpg";

    return {
      title: poet.name,
      description,
      keywords: [poet.name, "شعر فارسی", "شاعران ایرانی"],
      openGraph: {
        title: `${poet.name} | دفتر گنج`,
        description,
        type: "profile",
        images: [
          {
            url: ogImage,
            width: poetImage ? 320 : 1200,
            height: poetImage ? 320 : 675,
            alt: poet.name,
          },
        ],
        url: `https://ganj.directory/poet/${poet.id}`,
      },
      twitter: {
        card: "summary_large_image",
        title: `${poet.name} | دفتر گنج`,
        description,
        images: [ogImage],
      },
      alternates: {
        canonical: `https://ganj.directory/poet/${poet.id}`,
      },
    };
  } catch {
    return {
      title: "شاعر یافت نشد",
    };
  }
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
  let ganjoorUnavailable = false;
  let migratedPoet = false;

  try {
    const result = await hybridApi.getPoet(poetId);
    poet = result.poet;
    categories = result.categories;
  } catch (err) {
    if (err instanceof GanjoorUnavailableError) {
      ganjoorUnavailable = true;
      migratedPoet = await hybridApi.isPoetMigrated(poetId);
    }
    error = err instanceof Error ? err.message : "خطا در بارگذاری شاعر";
  }

  if (ganjoorUnavailable && !migratedPoet) {
    return <GanjoorOutageCard backHref="/" backLabel="بازگشت به صفحه اصلی" />;
  }

  if (error || !poet) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-foreground mb-4">خطا در بارگذاری</h1>
        <p className="text-muted-foreground dark:text-secondary-foreground mb-4">{error}</p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted dark:hover:bg-primary transition-colors"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    );
  }

  const isFamous = isFamousPoet(poet.slug || "");

  return (
    <div className="min-h-fit bg-primary/5 p-4 sm:p-6 rounded-3xl flex flex-col gap-4 backdrop-blur-md">
      <BreadcrumbStructuredData
        items={[
          { name: "دفتر گنج", url: "https://ganj.directory" },
          { name: poet.name, url: `https://ganj.directory/poet/${poet.id}` },
        ]}
      />
      <PersonStructuredData
        name={poet.name}
        description={poet.description}
        birthDate={poet.birthYear ? String(poet.birthYear) : undefined}
        deathDate={poet.deathYear ? String(poet.deathYear) : undefined}
        url={`https://ganj.directory/poet/${poet.id}`}
        image={getPoetImage(poet.slug || "") ? `https://ganj.directory/images/${getPoetImage(poet.slug || "")}` : undefined}
      />
      <Suspense fallback={<PoetPageSkeleton />}>
        <Breadcrumbs items={[{ label: poet.name }]} />

        <div className={`rounded-2xl shadow-xl shadow-primary/5 dark:shadow-none h-full overflow-hidden z-20 ${isFamous ? "bg-card" : "bg-card"}`}>
          <div className="text-right flex flex-col sm:flex-row items-stretch h-full">
            <div className={`relative w-full min-h-full flex-1 ${isFamous ? "border-l" : "border-l hidden"}`}>
              {/* Poet Image - only for famous poets - reserve space to prevent layout shift */}
              {getPoetImage(poet.slug || "") ? (
                <div className="relative w-full h-full shrink-0">
                  <Image
                    src={`/images/${getPoetImage(poet.slug || "")}`}
                    alt={`تصویر ${poet.name}`}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover max-h-90"
                    priority
                  />
                </div>
              ) : (
                // Reserve space for non-famous poets to prevent layout shift
                <div className="w-[140px] h-[140px] md:w-[160px] md:h-[160px] shrink-0" aria-hidden="true" />
              )}
            </div>

            <div className="flex-2">
              <div className={`flex items-center gap-6 ${isFamous ? "p-6" : "p-6"}`}>
                <div className="flex flex-col gap-1 align-start md:align-start text-right md:text-right">
                  <h1 className={`text-3xl font-bold ${isFamous ? "text-foreground" : "text-foreground"}`}>
                    {poet.name}
                  </h1>

                  {(poet.birthYear || poet.deathYear) && (
                    <p
                      className={`text-xl md:text-2xl font-normal ${
                        isFamous ? "text-secondary-foreground dark:text-warning" : "text-muted-foreground dark:text-secondary-foreground"
                      }`}
                    >
                      {poet.birthYear && poet.deathYear ? `${toPersianDigits(poet.birthYear)} - ${toPersianDigits(poet.deathYear)}` : poet.birthYear ? toPersianDigits(poet.birthYear) : poet.deathYear ? toPersianDigits(poet.deathYear) : ''}
                    </p>
                  )}
                </div>
              </div>

              {poet.description && <ExpandableDescription description={poet.description} isFamous={isFamous} maxLength={300} />}
            </div>
          </div>
        </div>

        <div>
          {/* Poet Search - key prop ensures fresh instance on navigation */}
          <PoetSearch key={poetId} poetId={poetId} poetName={poet.name} />

          <h2
            className={`text-lg font-semibold mb-4 text-right ${
              isFamous ? "text-foreground" : "text-foreground"
            }`}
          >
            مجموعه‌ها
          </h2>
          <CategoryList categories={categories} poetId={poetId} isFamous={isFamous} />
        </div>
      </Suspense>
    </div>
  );
}
