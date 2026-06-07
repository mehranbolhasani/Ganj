import FaalLayoutClient from '@/app/faal/FaalLayoutClient';
import { FaalProviderWrapper } from '@/components/FaalProviderWrapper';

// Server Component - renders dark background immediately in initial HTML
export default function FaalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FaalProviderWrapper>
      <FaalLayoutClient>
        {children}
      </FaalLayoutClient>
    </FaalProviderWrapper>
  );
}
