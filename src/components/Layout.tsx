import Header from './Header';
import Footer from './Footer';
import AuroraBackground from './AuroraBackground';
import ParticleBackground from './ParticleBackground';
import TestBackground from './TestBackground';
import SimpleBackground from './SimpleBackground';
import BackgroundToggle from './BackgroundToggle';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-900 transition-colors duration-300 relative">
      {/* Animated Backgrounds - Full screen */}
      <ParticleBackground />
      <BackgroundToggle />
      
      {/* Content Container - 90% width on mobile, max-width on larger screens */}
      <div className="relative z-10 flex flex-col items-center container-responsive min-h-dvh gap-8">
        <Header />
        <main className="w-full flex flex-col gap-8">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
