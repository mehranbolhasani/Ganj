import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-900 transition-colors duration-300">
      {/* Grid background with fade-out effect */}
      <div className="grid-background" />
      
      {/* Content Container - Mobile optimized */}
      <div className="relative z-10 flex flex-col items-center container-responsive min-h-dvh gap-4 sm:gap-8">
        <Header />
        <main className="w-full flex flex-col gap-4 sm:gap-8">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
