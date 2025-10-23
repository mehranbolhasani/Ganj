import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import PoetCard from '@/components/PoetCard';
import Footer from '@/components/Footer';
import ParticleBackground from '@/components/ParticleBackground';
import { ganjoorApi } from '@/lib/ganjoor-api';
import { Poet } from '@/lib/types';

export default async function Home() {
  let poets: Poet[] = [];
  let error: string | null = null;

  // Phase 1: Limit to specific poets from Ganjoor main website
  const targetPoets = [
    'hafez',      // حافظ
    'saadi',      // سعدی
    'moulavi',    // مولانا
    'ferdousi',   // فردوسی
    'khayyam',    // خیام
    'saeb',       // صائب
    'attar',      // عطار
    'iraj',       // ایرج میرزا
    'nezami',     // نظامی
    'shahriar'    // شهریار
  ];

  try {
    const allPoets = await ganjoorApi.getPoets();
    poets = allPoets.filter(poet => poet.slug && targetPoets.includes(poet.slug));
  } catch (err) {
    error = err instanceof Error ? err.message : 'خطا در بارگذاری شاعران';
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-100 dark:bg-gray-900 relative">
        <ParticleBackground />
        <div className="relative z-10">
          <Header />
          <div className="text-center py-8 pt-32">
            <h1 className="text-2xl font-bold text-stone-900 dark:text-white mb-4">
              خطا در بارگذاری
            </h1>
            <p className="text-stone-600 dark:text-gray-400">
              {error}
            </p>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-gray-900 relative">
      {/* Animated Backgrounds - Full screen */}
      <ParticleBackground />
      
      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center mx-w-[640px] h-full gap-8 min-h-dvh">
        <Header />
        
        {/* Hero Section */}
        <HeroSection />
        
        {/* Poets Grid */}
        <div className="relative w-full max-w-[640px]">
          <div className="flex flex-wrap gap-4 justify-end">
            {poets.map((poet) => (
              <PoetCard key={poet.id} poet={poet} />
            ))}
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
}
