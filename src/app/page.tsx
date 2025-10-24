import Header from '@/components/Header';
import TestComponent from '@/components/TestComponent';
import Footer from '@/components/Footer';
import ParticleBackground from '@/components/ParticleBackground';
import { Poet } from '@/lib/types';

export default function Home() {
  // Temporarily remove API calls to test React refresh
  const poets: Poet[] = [];

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-900 relative">
      {/* Animated Backgrounds - Full screen */}
      <ParticleBackground />
      
      {/* Content Container - 90% width on mobile, max-width on larger screens */}
      <div className="relative z-10 flex flex-col items-center container-responsive min-h-dvh gap-8">
        <Header />
        
                {/* Test Component */}
                <TestComponent />
        
        {/* Poets Grid - Temporarily disabled */}
        <div className="relative w-full">
          <div className="text-center py-8">
            <p className="text-stone-600 dark:text-stone-300">Poets grid temporarily disabled for testing</p>
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
}
