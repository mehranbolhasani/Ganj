import Header from '@/components/Header';
import PoetsGrid from '@/components/PoetsGrid';
import Footer from '@/components/Footer';
import ParticleBackground from '@/components/ParticleBackground';

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-900 relative">
      {/* Animated Backgrounds - Full screen */}
      <ParticleBackground />
      
      {/* Content Container - 90% width on mobile, max-width on larger screens */}
      <div className="relative z-10 flex flex-col items-center container-responsive min-h-dvh gap-8">
        <Header />
        
        {/* Poets Grid - Client Component with API calls */}
        <PoetsGrid />
        
        <Footer />
      </div>
    </div>
  );
}
