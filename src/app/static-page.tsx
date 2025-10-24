import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ParticleBackground from '@/components/ParticleBackground';

export default function StaticPage() {
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-900 relative">
      {/* Animated Backgrounds - Full screen */}
      <ParticleBackground />
      
      {/* Content Container - 90% width on mobile, max-width on larger screens */}
      <div className="relative z-10 flex flex-col items-center container-responsive min-h-dvh gap-8">
        <Header />
        
        {/* Static Content */}
        <div className="relative w-full">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-4">
              دفتر گنج
            </h1>
            <p className="text-stone-600 dark:text-stone-300">
              مجموعه‌ای از بهترین اشعار فارسی
            </p>
            <div className="mt-8">
              <p className="text-stone-500 dark:text-stone-400">
                این صفحه برای تست React refresh error ایجاد شده است.
              </p>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
}
