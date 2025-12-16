import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import ThemeSync from "@/components/ThemeSync";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/Toast";
import PreloadInitializer from "@/components/PreloadInitializer";
import OfflineIndicator from "@/components/OfflineIndicator";
import RouteProgress from "@/components/RouteProgress";
import ScrollToTop from "@/components/ScrollToTop";
import Layout from "@/components/Layout";

import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { OrganizationStructuredData, WebsiteStructuredData } from "@/components/StructuredData"


export const metadata: Metadata = {
  title: {
    default: 'دفتر گنج',
    template: '%s | دفتر گنج',
  },
  description: 'دفتر گنج - مجموعه‌ای از بهترین اشعار فارسی',
  keywords: ['شعر فارسی', 'ادبیات فارسی', 'شاعران ایرانی', 'دفتر گنج', 'حافظ', 'سعدی', 'مولانا'],
  authors: [{ name: 'Mehran Bolhasani' }],
  creator: 'Mehran Bolhasani',
  publisher: 'Mehran Bolhasani',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ganj.directory/'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'android-chrome', url: '/android-chrome-192x192.png', sizes: '192x192' },
      { rel: 'android-chrome', url: '/android-chrome-512x512.png', sizes: '512x512' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: 'https://ganj.directory/',
    siteName: 'دفتر گنج',
    title: 'دفتر گنج',
    description: 'دفتر گنج - مجموعه‌ای از بهترین اشعار فارسی',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 675,
        alt: 'دفتر گنج',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'دفتر گنج',
    description: 'دفتر گنج - مجموعه‌ای از بهترین اشعار فارسی',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

// Critical CSS for faal page - respects theme system
const faalCriticalCSS = `
  /* Hide preload background by default */
  #faal-preload-bg {
    display: none;
  }
  /* Show preload bg when faal page element exists (SERVER RENDERED) */
  html:has([data-faal-page]) #faal-preload-bg {
    display: block !important;
  }
  /* Backup: JS-set attribute for preload bg */
  html[data-faal-route] #faal-preload-bg {
    display: block !important;
  }
  /* Hide grid background on faal page */
  html:has([data-faal-page]) .grid-background,
  html[data-faal-route] .grid-background {
    display: none !important;
  }
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html 
        lang="fa" 
        dir="rtl" 
        suppressHydrationWarning
      >
      <head>
        {/* Set color-scheme to support both themes */}
        <meta name="color-scheme" content="light dark" />
        {/* Script to handle Faal page preload background - respects theme system */}
        <script dangerouslySetInnerHTML={{ __html: `!function(){var p=location.pathname;var d=document;if(p==='/faal'||p.startsWith('/faal')){d.documentElement.setAttribute('data-faal-route','true');}else{setTimeout(function(){var bg=d.getElementById('faal-preload-bg');if(bg)bg.style.display='none';},0);}}();`}} />
        {/* Critical CSS for Faal page - respects theme system */}
        <style dangerouslySetInnerHTML={{ __html: faalCriticalCSS }} />
      </head>
      <body className="antialiased" style={{ fontFamily: 'Estedad, Abar VF, Vazirmatn, Vazir, Tahoma, Arial, sans-serif' }}>
        {/* Server-rendered background for Faal page - respects theme system */}
        {/* High z-index ensures it covers any backgrounds during initial paint */}
        {/* Hidden via JavaScript for non-faal pages, faded out via CSS for faal pages once content loads */}
        <div 
          id="faal-preload-bg" 
          className="fixed inset-0 bg-stone-950 dark:bg-stone-900 z-[9998] pointer-events-none transition-opacity duration-300"
          style={{ 
            display: 'none', // Hidden by default, shown via CSS for faal pages
          }}
          aria-hidden="true"
        />
        <OrganizationStructuredData
          name="دفتر گنج"
          url="https://ganj.directory"
          description="مجموعه‌ای از بهترین اشعار فارسی"
        />
        <WebsiteStructuredData url="https://ganj.directory" />
        <RouteProgress />
        <ScrollToTop />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          <ThemeSync />
          <ErrorBoundary>
            <ToastProvider>
              <Layout>
                {children}
              </Layout>
              <OfflineIndicator />
            </ToastProvider>
          </ErrorBoundary>
          <PreloadInitializer />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
