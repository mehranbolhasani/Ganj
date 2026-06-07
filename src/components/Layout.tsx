'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const pathname = usePathname();
  const isFaalPage = pathname === '/faal';

  // For faal page, render children directly without any wrapper
  // This allows the faal page's own layout to control all backgrounds
  if (isFaalPage) {
    return <>{children}</>;
  }

  // For other pages, render full layout with header, footer, backgrounds
  return (
    <div className="min-h-screen transition-colors duration-300 bg-background">
      {/* Skip Navigation Link for Accessibility */}
      <a
        href="#main-content"
        className="absolute -top-full focus:top-4 focus:right-4 z-50 px-4 py-2 bg-primary text-primary-foreground dark:text-foreground rounded-lg outline-none ring-2 ring-yellow-500 focus:ring-offset-2 transition-all"
      >
        پرش به محتوای اصلی
      </a>


      <div className="absolute w-full mx-auto h-120">
        <div className="w-full h-full bg-[repeating-linear-gradient(0deg,var(--foreground)_0px,var(--foreground)_1px,transparent_1px,transparent_24px)] bg-size-[100%_24px] dark:bg-[repeating-linear-gradient(0deg,var(--color-amber-900)_0px,var(--color-amber-900)_1px,transparent_1px,transparent_24px)] opacity-10 dark:opacity-40"></div>

        <div className="absolute top-0 w-full h-full bg-linear-to-b from-transparent to-background"></div>
      </div>

      {/* Content Container - Mobile optimized */}
      <div className="relative z-10 flex flex-col items-center min-h-dvh gap-0 container-responsive">
        <div className="fixed w-150 h-70 -top-20 left-1/2 -translate-x-1/2 -z-10 *:w-full flex items-start aspect-square blur-2xl opacity-25">
          <span className="block w-1/2 h-full bg-amber-500 rounded-full -translate-x-16 blur-3xl mix-blend-color-dodge"></span>
          <span className="block w-1/2 h-full bg-amber-700 rounded-full translate-x-16 blur-3xl mix-blend-color-dodge"></span>
        </div>
        <Header />
        <main id="main-content" className="w-full min-w-0 max-w-full flex flex-col gap-4">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
