import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-900 transition-colors duration-300">
      {/* Simple grid background */}
      <div
        className="fixed inset-0 z-0 opacity-30 dark:opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e2e8f0 1px, transparent 1px),
            linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
          `,
          backgroundSize: "20px 30px",
        }}
      />
      {/* Dark mode grid overlay */}
      <div
        className="fixed inset-0 z-0 dark:block hidden opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #292524 1px, transparent 1px),
            linear-gradient(to bottom, #292524 1px, transparent 1px)
          `,
          backgroundSize: "20px 30px",
        }}
      />
      
      {/* Content Container */}
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
