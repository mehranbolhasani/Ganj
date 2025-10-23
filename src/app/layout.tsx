import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";


export const metadata: Metadata = {
  title: {
    default: 'گنجور مدرن',
    template: '%s | گنجور مدرن',
  },
  description: 'وب‌سایت مدرن و ساده برای خواندن اشعار فارسی',
  keywords: ['شعر فارسی', 'ادبیات فارسی', 'شاعران ایرانی', 'گنجور', 'حافظ', 'سعدی', 'مولانا'],
  authors: [{ name: 'Ganjoor Modern' }],
  creator: 'Ganjoor Modern',
  publisher: 'Ganjoor Modern',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ganjoor-modern.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: 'https://ganjoor-modern.vercel.app',
    siteName: 'گنجور مدرن',
    title: 'گنجور مدرن',
    description: 'وب‌سایت مدرن و ساده برای خواندن اشعار فارسی',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'گنجور مدرن',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'گنجور مدرن',
    description: 'وب‌سایت مدرن و ساده برای خواندن اشعار فارسی',
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
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
