'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, Bug, Plus, Zap, Heart, Settings } from 'lucide-react';

export default function ChangelogPage() {
  return (
    <div className="max-w-4xl mx-auto w-full px-0 py-4">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 rotate-180" />
          بازگشت به صفحه اصلی
        </Link>
        
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-abar abar-wght-700 text-stone-900 dark:text-stone-100 mb-4">
              تاریخچه تغییرات
            </h1>
            <p className="text-stone-600 dark:text-stone-300 text-lg mb-8">
              تمام تغییرات و بهبودهای انجام شده در گنج
            </p>
          </div>
        </div>
      </div>

      {/* Current Version */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-xl p-4 mb-16 border border-blue-200 dark:border-blue-800/50">
        <div className="flex items-center gap-3 mb-9">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Star className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-abar abar-wght-700 text-stone-900 dark:text-stone-100">نسخه ۰/۲</h2>
            <p className="text-stone-600 dark:text-stone-300">آخرین به‌روزرسانی - ۱۰ نوامبر ۲۰۲۵</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-green-600" />
              ویژگی‌های جدید
            </h3>
            <ul className="space-y-2 text-sm text-stone-700 dark:text-stone-300">
              <li>• جستجوی معنی کلمات با انتخاب متن در شعرها (واژه‌یاب)</li>
              <li>• ناوبری بین اشعار (قبلی/بعدی)</li>
              <li>• جستجوی نامحدود با پشتیبانی از ۲۷,۰۰۰+ نتیجه</li>
              <li>• سیستم علاقه‌مندی‌ها برای ذخیره شعرهای مورد علاقه</li>
              <li>• تاریخچه بازدیدها برای پیگیری شعرهای خوانده شده</li>
              <li>• اسکریپت تست خودکار برای بررسی Layout Shifts</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-600" />
              بهبودها
            </h3>
            <ul className="space-y-2 text-sm text-stone-700 dark:text-stone-300">
              <li>• بهبود دسترسی‌پذیری (WCAG 2.1 AA)</li>
              <li>• رفع Layout Shifts برای تجربه بهتر</li>
              <li>• بهبود نسبت کنتراست رنگ‌ها</li>
              <li>• سرعت بارگذاری صفحات بهبود یافت</li>
              <li>• رابط کاربری زیباتر و کاربردی‌تر</li>
              <li>• تجربه کاربری بهتر در موبایل</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Bug className="w-4 h-4 text-red-600" />
              رفع مشکلات
            </h3>
            <ul className="space-y-2 text-sm text-stone-700 dark:text-stone-300">
              <li>• رفع مشکلات دسترسی‌پذیری در Vercel</li>
              <li>• رفع Layout Shifts در صفحات شعر و شاعر</li>
              <li>• رفع خطاهای ESLint و TypeScript</li>
              <li>• بهبود نام‌های دسترسی برای دکمه‌ها</li>
              <li>• رفع مشکلات موبایل</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Previous Versions */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-6">
          نسخه‌های قبلی
        </h2>

        {/* Version 1.0.0 */}
        <div className="bg-white dark:bg-stone-800 rounded-xl p-6 border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">نسخه ۰/۱</h3>
              <p className="text-stone-600 dark:text-stone-300">۱۹ اکتبر ۲۰۲۵ - اولین نسخه</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-1 gap-8">
            <div>
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-green-600" />
                ویژگی‌های اصلی
              </h4>
              <ul className="space-y-2 text-sm text-stone-700 dark:text-stone-300">
                <li>• نمایش ۶ شاعر معروف فارسی</li>
                <li>• ناوبری الفبایی برای تمام شاعران</li>
                <li>• صفحات اختصاصی برای هر شاعر</li>
                <li>• نمایش دسته‌بندی شعرها</li>
                <li>• طراحی ریسپانسیو</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" />
                فناوری
              </h4>
              <ul className="space-y-2 text-sm text-stone-700 dark:text-stone-300">
                <li>• Next.js 16 با Turbopack</li>
                <li>• TypeScript برای امنیت نوع</li>
                <li>• Tailwind CSS برای طراحی</li>
                <li>• پشتیبانی از RTL</li>
                <li>• بهینه‌سازی SEO</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
                <Bug className="w-4 h-4 text-red-600" />
                رفع مشکلات
              </h4>
              <ul className="space-y-2 text-sm text-stone-700 dark:text-stone-300">
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
