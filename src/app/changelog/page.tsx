'use client';

import React from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, Bug01Icon, FlashIcon, HeartIcon, PlusSignIcon, Settings01Icon, StarIcon } from '@hugeicons/core-free-icons';

export default function ChangelogPage() {
  return (
    <div className="max-w-4xl mx-auto w-full px-0 py-4">
      <div className="bg-primary/5 p-4 sm:p-6 rounded-3xl flex flex-col gap-4 backdrop-blur-md">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground dark:hover:text-secondary-foreground transition-colors mb-4"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} className="rotate-180" />
            بازگشت به صفحه اصلی
          </Link>

          <div className="flex items-center gap-3 mb-0">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">تاریخچه تغییرات</h1>
              <p className="text-muted-foreground dark:text-secondary-foreground text-base mb-0">تمام تغییرات و بهبودهای انجام شده در گنج</p>
            </div>
          </div>
        </div>

        {/* Current Version */}
        <div className="rounded-xl p-4 border bg-card">
          <div className="flex items-center gap-2 mb-12">
            <div>
              <h2 className="text-xl font-bold text-foreground">نسخه ۰/۳</h2>
              <p className="text-muted-foreground text-xs">آخرین به‌روزرسانی - ۱۶ دسامبر ۲۰۲۵</p>
            </div>
          </div>

          <div className="grid gap-8">
            <div className="space-y-3">
              <h3 className="font-semibold text-green-600 flex items-center gap-1">
                <HugeiconsIcon icon={PlusSignIcon} size={20} className="text-green-600" />
                ویژگی‌های جدید
              </h3>
              <ul className="space-y-2 text-sm text-secondary-foreground">
                <li>• <strong>فال حافظ</strong></li>
                <li>• <strong>جستجو در اشعار شاعر</strong> - جستجوی اختصاصی در اشعار هر شاعر</li>
                <li>• <strong>فیلتر شاعر در جستجوی سراسری</strong> - محدود کردن نتایج جستجو به شاعر خاص</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-warning flex items-center gap-1">
                <HugeiconsIcon icon={FlashIcon} size={20} className="text-warning" />
                بهبودها
              </h3>
              <ul className="space-y-2 text-sm text-secondary-foreground">
                <li>• بهبود عملکرد و بهینه‌سازی کد</li>
                <li>• رفع تمام خطاهای ESLint و TypeScript</li>
                <li>• بهبود مدیریت state در کامپوننت‌های React</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-destructive flex items-center gap-1">
                <HugeiconsIcon icon={Bug01Icon} size={20} className="text-destructive" />
                رفع مشکلات
              </h3>
              <ul className="space-y-2 text-sm text-secondary-foreground">
                <li>• رفع مشکلات React Hooks و setState در effects</li>
                <li>• رفع مشکلات TypeScript با انواع داده</li>
                <li>• بهبود مدیریت وابستگی‌های hooks</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Previous Versions */}
      <div className="space-y-6 mt-24">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          نسخه‌های قبلی
        </h2>

        {/* Version 0.2 */}
        <div className="bg-card rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-8">
            <div>
              <h3 className="text-lg font-bold text-foreground">نسخه ۰/۲</h3>
              <p className="text-muted-foreground dark:text-secondary-foreground text-xs">۱۰ نوامبر ۲۰۲۵</p>
            </div>
          </div>

          <div className="grid gap-8">
            <div>
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <HugeiconsIcon icon={PlusSignIcon} size={16} className="text-green-600" />
                ویژگی‌های جدید
              </h4>
              <ul className="space-y-2 text-sm text-secondary-foreground">
                <li>• جستجوی معنی کلمات با انتخاب متن در شعرها (واژه‌یاب)</li>
                <li>• ناوبری بین اشعار (قبلی/بعدی)</li>
                <li>• جستجوی نامحدود با پشتیبانی از ۲۷,۰۰۰+ نتیجه</li>
                <li>• سیستم علاقه‌مندی‌ها برای ذخیره شعرهای مورد علاقه</li>
                <li>• تاریخچه بازدیدها برای پیگیری شعرهای خوانده شده</li>
                <li>• اسکریپت تست خودکار برای بررسی Layout Shifts</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <HugeiconsIcon icon={FlashIcon} size={16} className="text-warning" />
                بهبودها
              </h4>
              <ul className="space-y-2 text-sm text-secondary-foreground">
                <li>• بهبود دسترسی‌پذیری (WCAG 2.1 AA)</li>
                <li>• رفع Layout Shifts برای تجربه بهتر</li>
                <li>• بهبود نسبت کنتراست رنگ‌ها</li>
                <li>• سرعت بارگذاری صفحات بهبود یافت</li>
                <li>• رابط کاربری زیباتر و کاربردی‌تر</li>
                <li>• تجربه کاربری بهتر در موبایل</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <HugeiconsIcon icon={Bug01Icon} size={16} className="text-destructive" />
                رفع مشکلات
              </h4>
              <ul className="space-y-2 text-sm text-secondary-foreground">
                <li>• رفع مشکلات دسترسی‌پذیری در Vercel</li>
                <li>• رفع Layout Shifts در صفحات شعر و شاعر</li>
                <li>• رفع خطاهای ESLint و TypeScript</li>
                <li>• بهبود نام‌های دسترسی برای دکمه‌ها</li>
                <li>• رفع مشکلات موبایل</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.1 */}
        <div className="bg-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-8">
            <div>
              <h3 className="text-lg font-bold text-foreground">نسخه ۰/۱</h3>
              <p className="text-muted-foreground dark:text-secondary-foreground text-xs">۱۹ اکتبر ۲۰۲۵ - اولین نسخه</p>
            </div>
          </div>

          <div className="grid gap-8">
            <div>
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <HugeiconsIcon icon={PlusSignIcon} size={16} className="text-green-600" />
                ویژگی‌های اصلی
              </h4>
              <ul className="space-y-2 text-sm text-secondary-foreground">
                <li>• نمایش ۶ شاعر معروف فارسی</li>
                <li>• ناوبری الفبایی برای تمام شاعران</li>
                <li>• صفحات اختصاصی برای هر شاعر</li>
                <li>• نمایش دسته‌بندی شعرها</li>
                <li>• طراحی ریسپانسیو</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <HugeiconsIcon icon={Settings01Icon} size={16} className="text-blue-600" />
                فناوری
              </h4>
              <ul className="space-y-2 text-sm text-secondary-foreground">
                <li>• Next.js ۱۶ با Turbopack</li>
                <li>• TypeScript برای امنیت نوع</li>
                <li>• Tailwind CSS برای طراحی</li>
                <li>• پشتیبانی از RTL</li>
                <li>• بهینه‌سازی SEO</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <HugeiconsIcon icon={Bug01Icon} size={16} className="text-destructive" />
                رفع مشکلات
              </h4>
              <ul className="space-y-2 text-sm text-secondary-foreground">
                <li>• رفع مشکلات موبایل</li>
                <li>• بهبود بارگذاری تصاویر</li>
                <li>• رفع مشکلات API</li>
                <li>• بهبود عملکرد کلی</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
