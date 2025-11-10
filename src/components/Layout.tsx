import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-900 transition-colors duration-300">
      {/* Skip Navigation Link for Accessibility */}
      <a
        href="#main-content"
        className="absolute -top-full focus:top-4 focus:right-4 z-50 px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg outline-none ring-2 ring-yellow-500 focus:ring-offset-2 transition-all"
      >
        پرش به محتوای اصلی
      </a>

      {/* Grid background with fade-out effect */}
      <div className="grid-background" />

      <div className="fixed -top-1/3 w-1/2 h-1/2 z-1 right-[50%] translate-x-1/2 flex items-center justify-center">
        <div className="w-full h-full bg-yellow-500 rounded-full blur-3xl opacity-20 -translate-x-16 mix-blend-hard-light"></div>
        <div className="w-full h-full bg-red-500 rounded-full blur-3xl opacity-20 translate-x-16 mix-blend-hard-light"></div>
      </div>
      
      {/* Content Container - Mobile optimized */}
      <div className="relative z-10 flex flex-col items-center container-responsive min-h-dvh gap-4 sm:gap-8">
        <Header />
        <main id="main-content" className="w-full flex flex-col gap-4 sm:gap-8">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
