import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";

import { Analytics } from "@vercel/analytics/next"


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
        height: 630,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
              <body className="antialiased" style={{ fontFamily: 'Estedad, DoranFaNum, Vazirmatn, Vazir, Tahoma, Arial, sans-serif' }}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
