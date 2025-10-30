import Link from 'next/link';
import Script from 'next/script';
import ContactForm from '@/components/ContactForm';

export const metadata = {
  title: 'تماس با من',
  description: 'راه‌های ارتباطی با سازنده دفتر گنج',
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-abar abar-wght-700 text-stone-900 dark:text-stone-100 mb-2">تماس با من</h1>
        <p className="text-stone-600 dark:text-stone-300">اگر ایرادی دیدید یا پیشنهادی دارید، از طریق فرم زیر یا ایمیل در تماس باشید.</p>
      </div>

      <div className="mb-8">
        <p className="text-stone-700 dark:text-stone-300 mb-2">
          ایمیل: {' '}
          <a href="mailto:bolhasani.mehran@gmail.com" className="text-yellow-600 dark:text-yellow-400 hover:underline">
            bolhasani.mehran@gmail.com
          </a>
        </p>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          یا از فرم زیر استفاده کنید:
        </p>
      </div>

      <div className="rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4">
        <ContactForm />
      </div>

      {/* If you still want to keep Tally as a fallback, we can leave the scripts commented below */}
      {false && <Script src="https://tally.so/widgets/embed.js" strategy="afterInteractive" />}

      <div className="mt-8 text-sm text-stone-500 dark:text-stone-400">
        <p>
          با ارسال فرم، پیامتون به صورت مستقیم برای من ارسال می‌شه. از همراهی‌تون ممنونم.
        </p>
        <p className="mt-2">
          بازگشت به {' '}
          <Link href="/" className="text-yellow-600 dark:text-yellow-400 hover:underline">صفحهٔ اصلی</Link>
        </p>
      </div>
    </div>
  );
}


