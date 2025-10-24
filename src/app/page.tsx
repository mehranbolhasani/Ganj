import Header from '@/components/Header';
import PoetsGrid from '@/components/PoetsGrid';
import Footer from '@/components/Footer';
import ParticleBackground from '@/components/ParticleBackground';

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-900/90 relative">
      {/* Animated Backgrounds - Full screen */}
      <ParticleBackground />

      {/* Example image */}
      {/* <div className="w-full h-full absolute top-0 left-0 z-1 opacity-10">
          <img 
            src="/images/dots.svg" 
            alt="dots" 
            className="w-auto h-auto shadow-inner shadow-stone-800 dark:shadow-stone-700"
          />
      </div> */}

      <div className="min-h-screen w-full absolute">
        {/* Top Fade Grid Background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e2e8f0 1px, transparent 1px),
              linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
            `,
            backgroundSize: "20px 30px",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)",
          }}
        />
          {/* Your Content/Components */}
      </div>
      
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
