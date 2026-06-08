import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سیاست حریم خصوصی",
  description:
    "سیاست حریم خصوصی دفتر گنج: توضیح جمع‌آوری، استفاده و نگهداری اطلاعات کاربران.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-[60vh] py-12 px-4">
      <div className="max-w-[680px] mx-auto bg-card/80 dark:bg-warning/10 backdrop-blur-sm rounded-3xl border border-border p-8 shadow-lg shadow-primary/5">
        {/* Persian Section — RTL */}
        <div dir="rtl" className="space-y-6">
          <h1 className="text-2xl font-bold text-foreground">
            سیاست حریم خصوصی دفتر گنج
          </h1>

          <p className="text-foreground leading-relaxed">
            دفتر گنج یک وب‌سایت خواندن اشعار فارسی است. این صفحه توضیح می‌دهد که چه اطلاعاتی جمع‌آوری می‌شود، چرا، و چگونه از آن استفاده می‌کنیم.
          </p>

          <p className="text-foreground leading-relaxed">
            <strong>آخرین به‌روزرسانی:</strong> خرداد ۱۴۰۵
          </p>

          <div className="space-y-1">
            <p className="font-bold text-foreground">۱. اطلاعات جمع‌آوری‌شده</p>
            <p className="text-foreground leading-relaxed">
              اگر بدون ورود به سیستم از سایت استفاده کنید، هیچ اطلاعاتی از شما در سرور ذخیره نمی‌شود. علاقه‌مندی‌ها و تاریخچه‌ی بازدید به‌صورت محلی در مرورگر شما نگهداری می‌شوند.
            </p>
            <p className="text-foreground leading-relaxed">
              اگر حساب کاربری ایجاد کنید، اطلاعات زیر ذخیره می‌شود:
            </p>
            <ul className="list-disc list-inside text-foreground leading-relaxed mr-4 space-y-1">
              <li>آدرس ایمیل</li>
              <li>نام نمایشی</li>
              <li>تصویر پروفایل (در صورت ورود با گوگل)</li>
              <li>علاقه‌مندی‌های ذخیره‌شده (شناسه‌ی اشعار)</li>
            </ul>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-foreground">۲. نحوه‌ی استفاده از اطلاعات</p>
            <p className="text-foreground leading-relaxed">
              اطلاعات شما تنها برای ارائه‌ی خدمات سایت استفاده می‌شود: ورود به حساب، همگام‌سازی علاقه‌مندی‌ها در دستگاه‌های مختلف، و نمایش نام و تصویر شما در پروفایل. اطلاعات شما به هیچ شخص یا سازمان ثالثی فروخته یا واگذار نمی‌شود.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-foreground">۳. ربات تلگرام</p>
            <p className="text-foreground leading-relaxed">
              ربات تلگرام دفتر گنج (ganjdirectorybot@) هیچ اطلاعات شخصی کاربران را ذخیره نمی‌کند. تنها داده‌های آماری ناشناس (مانند تعداد جستجوها) برای بهبود خدمات ثبت می‌شود. این داده‌ها به هویت کاربران مرتبط نیستند.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-foreground">۴. ذخیره‌سازی اطلاعات</p>
            <p className="text-foreground leading-relaxed">
              اطلاعات حساب کاربری روی سرورهای Supabase (زیرساخت AWS) نگهداری می‌شود. ارتباط با سرور از طریق HTTPS رمزگذاری می‌شود.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-foreground">۵. کوکی‌ها و ذخیره‌سازی محلی</p>
            <p className="text-foreground leading-relaxed">
              برای کاربران مهمان، از localStorage مرورگر برای نگهداری علاقه‌مندی‌ها و تاریخچه استفاده می‌شود. این داده‌ها هرگز به سرور ارسال نمی‌شوند. برای کاربران دارای حساب، از کوکی‌های امن برای مدیریت نشست استفاده می‌شود.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-foreground">۶. حذف اطلاعات</p>
            <p className="text-foreground leading-relaxed">
              برای حذف حساب کاربری و تمام اطلاعات مرتبط، با ما از طریق ایمیل زیر تماس بگیرید. درخواست‌ها ظرف ۷ روز کاری پردازش می‌شوند.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-foreground">۷. تماس</p>
            <p className="text-foreground leading-relaxed">
              اگر سوالی درباره‌ی حریم خصوصی دارید، با ما از طریق صفحه‌ی تماس یا ایمیل hi@ganj.directory در تماس باشید.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-border" />

        {/* English Section — LTR */}
        <div dir="ltr" className="space-y-6">
          <h2 className="text-xl font-bold text-foreground">
            Privacy Policy (English Summary)
          </h2>

          <p className="text-foreground leading-relaxed">
            <strong>Last updated:</strong> June 2025
          </p>

          <p className="text-foreground leading-relaxed">
            Ganj (ganj.directory) is a Persian poetry reading app. This is a summary of our privacy practices.
          </p>

          <div className="space-y-1">
            <p className="font-bold text-foreground">What we collect</p>
            <p className="text-foreground leading-relaxed">
              Guest users: no server-side data. Bookmarks and history are stored locally in your browser only.
            </p>
            <p className="text-foreground leading-relaxed">
              Signed-in users: email address, display name, profile picture (Google login only), and saved bookmark IDs.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-foreground">How we use it</p>
            <p className="text-foreground leading-relaxed">
              Your data is used solely to provide the service: authentication, bookmark sync across devices, and profile display. We do not sell or share your data with any third party.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-foreground">Telegram bot</p>
            <p className="text-foreground leading-relaxed">
              The Ganj Telegram bot (@ganjdirectorybot) stores no personal data. Only anonymous aggregate usage statistics are recorded (search counts, etc.) and these are not linked to any individual.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-foreground">Data storage</p>
            <p className="text-foreground leading-relaxed">
              Account data is stored on Supabase (AWS infrastructure), transmitted over HTTPS.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-foreground">Data deletion</p>
            <p className="text-foreground leading-relaxed">
              To delete your account and all associated data, contact us at hi@ganj.directory. Requests are processed within 7 business days.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-foreground">Contact</p>
            <p className="text-foreground leading-relaxed">
              hi@ganj.directory
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
