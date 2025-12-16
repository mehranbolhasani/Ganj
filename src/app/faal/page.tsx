import type { Metadata } from 'next';
import FaalHafez from '@/components/FaalHafez';
import { FaalErrorBoundary } from '@/components/FaalErrorBoundary';

export const metadata: Metadata = {
  title: 'فال حافظ',
  description: 'فال حافظ - با نیت پاک دل بگشای و از لسان‌الغیب پاسخ بگیر',
  keywords: ['فال حافظ', 'غزلیات حافظ', 'شعر حافظ', 'لسان الغیب', 'دیوان حافظ'],
  openGraph: {
    title: 'فال حافظ | دفتر گنج',
    description: 'فال حافظ - با نیت پاک دل بگشای و از لسان‌الغیب پاسخ بگیر',
    type: 'website',
  },
};

export default function FaalPage() {
  return (
    <FaalErrorBoundary>
      <FaalHafez />
    </FaalErrorBoundary>
  );
}

