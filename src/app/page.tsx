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

  try {
    // Get all poets from the API - this is efficient due to caching
    poets = await ganjoorApi.getPoets();
    console.log(`Loaded ${poets.length} poets from Ganjoor API`);
  } catch (err) {
    error = err instanceof Error ? err.message : 'خطا در بارگذاری شاعران';
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-100 dark:bg-stone-900 relative">
        <ParticleBackground />
        <div className="relative z-10">
          <Header />
          <div className="text-center py-8 pt-32">
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-4">
              خطا در بارگذاری
            </h1>
            <p className="text-stone-600 dark:text-stone-200">
              {error}
            </p>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-900 relative">
      {/* Animated Backgrounds - Full screen */}
      <ParticleBackground />
      
      {/* Content Container - 90% width on mobile, max-width on larger screens */}
      <div className="relative z-10 flex flex-col items-center container-responsive min-h-dvh gap-8">
        <Header />
        
        {/* Hero Section */}
        <HeroSection />
        
        {/* Poets Grid */}
        <div className="relative w-full">
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
