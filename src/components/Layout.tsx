import Header from './Header';
import Footer from './Footer';
import ParticleBackground from './ParticleBackground';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-900 transition-colors duration-300 relative">
      {/* Animated Backgrounds - Full screen */}
      <ParticleBackground />

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
              "radial-gradient(ellipse 50% 80% at 50% 0%, #000 60%, transparent 100%)",
            maskImage:
              "radial-gradient(ellipse 50% 80% at 50% 0%, #000 60%, transparent 100%)",
          }}
        />
        {/* Dark mode grid overlay */}
        <div
          className="absolute inset-0 z-0 dark:block hidden"
          style={{
            backgroundImage: `
              linear-gradient(to right, #292524 1px, transparent 1px),
              linear-gradient(to bottom, #292524 1px, transparent 1px)
            `,
            backgroundSize: "20px 30px",
            WebkitMaskImage:
              "radial-gradient(ellipse 100% 100% at 50% 0%, #000 90%, transparent 100%)",
            maskImage:
              "radial-gradient(ellipse 100% 100% at 50% 0%, #000 90%, transparent 100%)",
          }}
        />
          {/* Your Content/Components */}
      </div>
      
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
