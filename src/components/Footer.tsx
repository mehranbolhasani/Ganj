import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="flex flex-col items-center justify-between px-0 pt-8 pb-16 w-full">
      <div className="flex flex-col items-center justify-between w-full text-center px-8 sm:px-16 py-24 gap-2">
        <span className="w-px h-16 bg-yellow-500 dark:bg-yellow-700 mb-8"></span>
        <h2 className="text-3xl font-abar abar-wght-700 text-stone-900 dark:text-stone-100 mb-6">درباره دفتر گنج</h2>
        <p className="leading-relaxed">این وب‌سایت کوچیک با استفاده از API رسمی سایت گنجور ساخته شده. تمام امتیاز محتوایی که می‌بینید و می‌خونید هم برای سازنده گنجور محفوظه. هدف از ساخت این سایت ارائه یه نسخه سبک‌تر و مدرن‌تر از گنجور بوده. تمام <a href="https://github.com/mehranbolhasani/Ganj" target="_blank" rel="noopener noreferrer" className="text-yellow-800 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300 underline">کدهای سایت روی گیت‌هاب</a> در دسترسه. لطفاً توجه داشته باشید که امکاناتی مثل «علاقه‌مندی‌ها» و «تاریخچه» تماماً به صورت لوکال و روی مرورگر شما انجام می‌شه و هیچ دیتایی به سرور سایت منتقل نمی‌شه.</p>

        <p className="leading-relaxed">اگر ایرادی توی سایت پیدا کردین، یا پیشنهاد و ایده‌ای برای بهتر شدنش دارین، خیلی خیلی ممنون می‌شم از طریق <a href="/contact" className="text-yellow-800 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300 underline">صفحه تماس با من</a>، بهم اطلاع بدین.</p>

        <p className="leading-relaxed pt-4">ممنون<br />مهران</p>
        <span className="w-px h-16 bg-yellow-300 dark:bg-yellow-700 mt-8"></span>
      </div>
      <div className="flex items-center justify-between w-full pt-6">
        {/* Left side - Version */}
        <Link
          href="/changelog"
          className="px-4 py-2 rounded-md text-sm text-stone-900 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-800 transition-colors"
        >
          نسخه ۰/۲
        </Link>
  
        {/* Right side - Navigation */}
        <nav className="flex items-center gap-1">
          <Link
            href="/roadmap"
            className="px-4 py-2 rounded-md text-sm text-stone-900 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-800 transition-colors"
          >
            نقشه راه
          </Link>
          
          <div className="w-2 h-px bg-stone-400 dark:bg-stone-600 mx-1"></div>
          
          <Link
            href="https://ganjoor.net"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-md text-sm text-stone-900 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-800 transition-colors"
          >
            سایت گنجور
          </Link>
        </nav>
      </div>
    </footer>
  );
}
