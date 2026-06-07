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
        <h1 className="text-3xl text-foreground mb-2">تماس با من</h1>
        <p className="text-muted-foreground dark:text-secondary-foreground">اگر ایرادی دیدید یا پیشنهادی دارید، از طریق فرم زیر یا ایمیل در تماس باشید.</p>
      </div>

      <div className="mb-8">
        <p className="text-secondary-foreground mb-2">
          ایمیل: {' '}
          <a href="mailto:bolhasani.mehran@gmail.com" className="text-warning hover:underline">
            bolhasani.mehran@gmail.com
          </a>
        </p>
        <p className="text-sm text-muted-foreground">
          یا از فرم زیر استفاده کنید:
        </p>
      </div>

      <div className="rounded-xl overflow-hidden border border-border bg-card dark:bg-primary p-4">
        <ContactForm />
      </div>

      {/* If you still want to keep Tally as a fallback, we can leave the scripts commented below */}
      {false && <Script src="https://tally.so/widgets/embed.js" strategy="afterInteractive" />}

      <div className="mt-8 text-sm text-muted-foreground">
        <p>
          با ارسال فرم، پیامتون به صورت مستقیم برای من ارسال می‌شه. از همراهی‌تون ممنونم.
        </p>
        <p className="mt-2">
          بازگشت به {' '}
          <Link href="/" className="text-warning hover:underline">صفحهٔ اصلی</Link>
        </p>
      </div>
    </div>
  );
}
