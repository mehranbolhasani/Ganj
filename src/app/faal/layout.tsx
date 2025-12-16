import FaalLayoutClient from '@/app/faal/FaalLayoutClient';
import { FaalProviderWrapper } from '@/components/FaalProviderWrapper';

// Server Component - renders dark background immediately in initial HTML
export default function FaalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Fixed background - respects theme system */}
      <div 
        data-faal-page
        className="fixed inset-0 bg-stone-950 dark:bg-stone-900 z-0"
        aria-hidden="true"
      />
      {/* Provider wrapper - manages state and provides context to all children */}
      <FaalProviderWrapper>
        {/* Client component handles all interactive/dynamic parts */}
        <FaalLayoutClient>
          {children}
        </FaalLayoutClient>
      </FaalProviderWrapper>
    </>
  );
}
