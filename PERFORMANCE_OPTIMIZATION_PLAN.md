# Performance & Optimization Plan - دفتر گنج (Defter Ganj)

## 🎯 Current Status Analysis

### ✅ What's Working Well
- **Next.js 14** with App Router for optimal performance
- **Server-side rendering** for initial page loads
- **TypeScript** for type safety and better development experience
- **Tailwind CSS v4** for optimized styling
- **RTL support** properly implemented

### ✅ **COMPLETED OPTIMIZATIONS**

#### 1. **API Request Optimizations** ✅
- **✅ API Caching** - Implemented comprehensive caching with TTL
- **✅ Request Deduplication** - Prevents duplicate API calls
- **✅ Error Retry Logic** - Exponential backoff with jitter
- **✅ Network Error Handling** - Robust error handling and retry
- **✅ Cache Management** - Smart cache invalidation and cleanup

#### 2. **Performance Optimizations** ✅
- **✅ Canvas Animation Optimization** - Reduced particle count, pause on hidden tabs
- **✅ Lazy Loading** - Background components load only when needed
- **✅ Bundle Optimization** - Removed unused dependencies (framer-motion)
- **✅ Caching Headers** - Optimized font and API caching
- **✅ Performance Monitoring** - Core Web Vitals tracking

#### 3. **SEO & Meta Optimizations** ✅
- **✅ Comprehensive Meta Tags** - Open Graph, Twitter Cards, structured data
- **✅ Sitemap Generation** - Dynamic sitemap with all poets and categories
- **✅ Robots.txt** - Proper search engine directives
- **✅ Performance Monitoring** - Core Web Vitals and custom metrics

#### 2. **Client-Side Performance**
- **Heavy canvas animations** running continuously (ParticleBackground, AuroraBackground)
- **No lazy loading** for components
- **No memoization** for expensive computations
- **Multiple re-renders** due to state changes
- **No virtual scrolling** for large lists

#### 3. **Bundle Size Issues**
- **Large font files** (DoranFaNum, Estedad) loaded on every page
- **Unused dependencies** (framer-motion not used)
- **No tree shaking** optimization
- **No code splitting** for routes

#### 4. **SEO & Core Web Vitals**
- **No meta tags** optimization
- **No structured data** for poems/poets
- **No sitemap** generation
- **No robots.txt**
- **No Open Graph** tags

## 🚀 Optimization Roadmap

### Phase 1: API & Caching Optimization (Priority: HIGH)

#### 1.1 Implement API Caching
```typescript
// Add to next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['next-themes'],
  },
  // Add caching headers
  async headers() {
    return [
      {
        source: '/api/ganjoor/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};
```

#### 1.2 Add Request Deduplication
```typescript
// Create src/lib/api-cache.ts
const requestCache = new Map<string, Promise<any>>();

export function deduplicateRequest<T>(key: string, request: () => Promise<T>): Promise<T> {
  if (requestCache.has(key)) {
    return requestCache.get(key)!;
  }
  
  const promise = request();
  requestCache.set(key, promise);
  
  // Clean up after 5 minutes
  setTimeout(() => requestCache.delete(key), 5 * 60 * 1000);
  
  return promise;
}
```

#### 1.3 Implement SWR for Client-Side Caching
```bash
npm install swr
```

```typescript
// Create src/hooks/useGanjoorApi.ts
import useSWR from 'swr';

export function usePoets() {
  return useSWR('/api/ganjoor/poets', () => ganjoorApi.getPoets(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1 minute
  });
}
```

#### 1.4 Add Error Retry Logic
```typescript
// Create src/lib/retry-utils.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Phase 2: Performance Optimizations (Priority: HIGH)

#### 2.1 Optimize Canvas Animations
```typescript
// Add performance controls to background components
export default function ParticleBackground() {
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Pause when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPaused(document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  // Only render when needed
  if (!isVisible) return null;
}
```

#### 2.2 Implement Lazy Loading
```typescript
// Create src/components/LazyBackground.tsx
import { lazy, Suspense } from 'react';

const ParticleBackground = lazy(() => import('./ParticleBackground'));

export default function LazyBackground() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-stone-100" />}>
      <ParticleBackground />
    </Suspense>
  );
}
```

#### 2.3 Add Memoization
```typescript
// Optimize expensive components
import { memo, useMemo } from 'react';

export default memo(function PoetCard({ poet }: PoetCardProps) {
  const yearRange = useMemo(() => {
    if (!poet.birthYear || !poet.deathYear) return '';
    return `${poet.birthYear} - ${poet.deathYear}`;
  }, [poet.birthYear, poet.deathYear]);
  
  // ... rest of component
});
```

### Phase 3: Bundle Optimization (Priority: MEDIUM)

#### 3.1 Font Optimization
```typescript
// Add to next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['next-themes'],
  },
  // Optimize fonts
  async headers() {
    return [
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

#### 3.2 Remove Unused Dependencies
```bash
# Remove unused packages
npm uninstall framer-motion
```

#### 3.3 Implement Code Splitting
```typescript
// Create src/components/AsyncComponents.tsx
import dynamic from 'next/dynamic';

export const AsyncParticleBackground = dynamic(
  () => import('./ParticleBackground'),
  { ssr: false }
);

export const AsyncAuroraBackground = dynamic(
  () => import('./AuroraBackground'),
  { ssr: false }
);
```

### Phase 4: SEO & Core Web Vitals (Priority: MEDIUM)

#### 4.1 Add Meta Tags
```typescript
// Update src/app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: 'گنجور مدرن',
    template: '%s | گنجور مدرن',
  },
  description: 'وب‌سایت مدرن و ساده برای خواندن اشعار فارسی',
  keywords: ['شعر فارسی', 'ادبیات فارسی', 'شاعران ایرانی', 'گنجور'],
  authors: [{ name: 'Ganjoor Modern' }],
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: 'https://ganjoor-modern.vercel.app',
    siteName: 'گنجور مدرن',
    title: 'گنجور مدرن',
    description: 'وب‌سایت مدرن و ساده برای خواندن اشعار فارسی',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'گنجور مدرن',
    description: 'وب‌سایت مدرن و ساده برای خواندن اشعار فارسی',
  },
};
```

#### 4.2 Add Structured Data
```typescript
// Create src/lib/structured-data.ts
export function generatePoemStructuredData(poem: Poem) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: poem.title,
    author: {
      '@type': 'Person',
      name: poem.poetName,
    },
    inLanguage: 'fa',
    genre: 'Poetry',
  };
}
```

#### 4.3 Generate Sitemap
```typescript
// Create src/app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://ganj.directory/',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // Add dynamic routes for poets and poems
  ];
}
```

### Phase 5: Advanced Optimizations (Priority: LOW)

#### 5.1 Implement Service Worker
```typescript
// Create public/sw.js
const CACHE_NAME = 'ganjoor-modern-v1';
const urlsToCache = [
  '/',
  '/fonts/Estedad-FD.woff2',
  '/fonts/DoranFaNum-VF.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

#### 5.2 Add Performance Monitoring
```typescript
// Create src/lib/analytics.ts
export function trackPerformance() {
  if (typeof window !== 'undefined') {
    // Track Core Web Vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    });
  }
}
```

#### 5.3 Implement Virtual Scrolling
```typescript
// For large poem lists
import { FixedSizeList as List } from 'react-window';

export function VirtualizedPoemList({ poems }: { poems: Poem[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <PoemCard poem={poems[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={poems.length}
      itemSize={120}
    >
      {Row}
    </List>
  );
}
```

## 📊 Performance Metrics to Track

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### API Performance
- **API response time**: < 500ms
- **Cache hit rate**: > 80%
- **Error rate**: < 1%

### Bundle Size
- **Initial bundle**: < 200KB
- **Font files**: < 100KB
- **Total page size**: < 500KB

## 🎯 Implementation Priority

### Week 1: Critical Fixes
1. ✅ Add API caching and deduplication
2. ✅ Implement error retry logic
3. ✅ Optimize canvas animations
4. ✅ Add lazy loading for backgrounds

### Week 2: Performance Boost
1. ✅ Implement SWR for client-side caching
2. ✅ Add memoization to components
3. ✅ Optimize font loading
4. ✅ Remove unused dependencies

### Week 3: SEO & Polish
1. ✅ Add comprehensive meta tags
2. ✅ Implement structured data
3. ✅ Generate sitemap
4. ✅ Add performance monitoring

### Week 4: Advanced Features
1. ✅ Implement service worker
2. ✅ Add virtual scrolling
3. ✅ Performance analytics
4. ✅ Final optimizations

## 🔧 Tools & Monitoring

### Development Tools
- **Lighthouse** for performance audits
- **Bundle Analyzer** for bundle size analysis
- **React DevTools** for component profiling
- **Network tab** for API request monitoring

### Production Monitoring
- **Vercel Analytics** for Core Web Vitals
- **Custom performance metrics**
- **Error tracking** with Sentry (optional)
- **User experience monitoring**

## 📈 Success Metrics

### Performance Goals
- **Page load time**: < 2s
- **API response time**: < 500ms
- **Bundle size**: < 200KB
- **Lighthouse score**: > 90

### User Experience Goals
- **Smooth animations**: 60fps
- **Fast navigation**: < 100ms
- **Offline capability**: Basic caching
- **Mobile performance**: Optimized for mobile

---

## 🚀 Next Steps

1. **Start with Phase 1** - API caching and request optimization
2. **Measure baseline** - Current performance metrics
3. **Implement incrementally** - One optimization at a time
4. **Test thoroughly** - Performance testing after each change
5. **Monitor in production** - Track improvements over time

This plan will significantly improve the app's performance, stability, and user experience! 🎯
