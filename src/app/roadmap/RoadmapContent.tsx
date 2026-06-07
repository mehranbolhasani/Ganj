'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, Bookmark03Icon, CheckmarkCircle01Icon, Clock01Icon, FilterIcon, Group01Icon, HeartIcon, Search01Icon, Share08Icon, SmartPhone01Icon, ViewIcon } from '@hugeicons/core-free-icons';
import { toPersianDigits } from '@/lib/persian-digits';

export default function RoadmapContent() {
  const [activeTab, setActiveTab] = useState<'current' | 'upcoming'>('current');

  const currentFeatures = [
    {
      icon: Search01Icon,
      title: 'جستجوی پیشرفته',
      description: 'جستجو در شعرها، شاعران و دسته‌بندی‌ها با فیلترهای هوشمند',
      status: 'completed',
      progress: 100
    },
    {
      icon: Bookmark03Icon,
      title: 'سیستم علاقه‌مندی‌ها',
      description: 'ذخیره و مدیریت شعرهای مورد علاقه با امکان دسته‌بندی',
      status: 'completed',
      progress: 100
    },
    {
      icon: ViewIcon,
      title: 'تاریخچه بازدیدها',
      description: 'پیگیری شعرهای خوانده شده و پیشنهاد محتوا',
      status: 'completed',
      progress: 100
    },
    {
      icon: SmartPhone01Icon,
      title: 'بهینه‌سازی موبایل',
      description: 'تجربه کاربری بهتر در دستگاه‌های موبایل',
      status: 'completed',
      progress: 100
    }
  ];

  const upcomingFeatures = [
    {
      icon: FilterIcon,
      title: 'فیلترهای پیشرفته',
      description: 'فیلتر بر اساس دوره تاریخی، موضوع، و ویژگی‌های شعر',
      status: 'in-progress',
      progress: 60,
      eta: 'نوامبر ۲۰۲۵'
    },
    {
      icon: Share08Icon,
      title: 'اشتراک‌گذاری شعرها',
      description: 'اشتراک‌گذاری شعرها در شبکه‌های اجتماعی و پیام‌رسان‌ها',
      status: 'in-progress',
      progress: 40,
      eta: 'نوامبر ۲۰۲۵'
    },
    {
      icon: Group01Icon,
      title: 'حساب کاربری',
      description: 'ثبت‌نام و ورود برای همگام‌سازی داده‌ها',
      status: 'planned',
      progress: 0,
      eta: 'دسامبر ۲۰۲۵'
    },
    {
      icon: Group01Icon,
      title: 'ترجمه شعرها',
      description: 'ترجمه شعرها به زبان‌های مختلف',
      status: 'planned',
      progress: 0,
      eta: 'دسامبر ۲۰۲۵'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'in-progress': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'تکمیل شده';
      case 'in-progress': return 'در حال انجام';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-0 py-4 w-full">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground dark:hover:text-secondary-foreground transition-colors mb-8"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} className="rotate-180" />
          بازگشت به صفحه اصلی
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl text-foreground mb-4">
              نقشه راه گنج
            </h1>
            <p className="text-muted-foreground dark:text-secondary-foreground text-lg">
              برنامه‌ریزی آینده و ویژگی‌های در حال توسعه
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 bg-muted rounded-lg p-1">
        <button
          onClick={() => setActiveTab('current')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'current'
              ? 'bg-card dark:bg-secondary text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground dark:hover:text-secondary-foreground'
          }`}
        >
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
          ویژگی‌های فعلی
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'upcoming'
              ? 'bg-card dark:bg-secondary text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground dark:hover:text-secondary-foreground'
          }`}
        >
          <HugeiconsIcon icon={Clock01Icon} size={16} />
          برای آینده
        </button>
      </div>

      {/* Current Features */}
      {activeTab === 'current' && (
        <div className="space-y-6">
          <div className="bg-green-50/50 dark:bg-green-950/40 rounded-xl p-4 border border-green-200 dark:border-green-800/50">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} className="text-green-600" />
              ویژگی‌های تکمیل شده
            </h2>
            <p className="text-secondary-foreground mb-6">
              این ویژگی‌ها در حال حاضر در گنج موجودن و می‌تونید ازشون استفاده کنید.
            </p>

            <div className="grid md:grid-cols-1 gap-4">
              {currentFeatures.map((feature, index) => (
                <div key={index} className="bg-card rounded-lg p-4 border border-border">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <HugeiconsIcon icon={feature.icon} size={20} className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {feature.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}>
                          {getStatusText(feature.status)}
                        </span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${feature.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {toPersianDigits(feature.progress)}٪
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Features */}
      {activeTab === 'upcoming' && (
        <div className="space-y-6">
          <div className="bg-blue-50/50 dark:bg-blue-950/40 rounded-xl p-4 border border-blue-200 dark:border-blue-800/50">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <HugeiconsIcon icon={Clock01Icon} size={20} className="text-blue-600" />
              ویژگی‌های در حال توسعه
            </h2>
            <p className="text-secondary-foreground mb-6">
              این ویژگی‌ها در حال توسعه هستن و به زودی در دسترس قرار خواهند گرفت.
            </p>

            <div className="space-y-4">
              {upcomingFeatures.map((feature, index) => (
                <div key={index} className="bg-card rounded-lg p-4 border border-border">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <HugeiconsIcon icon={feature.icon} size={20} className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground">
                          {feature.title}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          {feature.eta}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {feature.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}>
                          {getStatusText(feature.status)}
                        </span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${feature.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {toPersianDigits(feature.progress)}٪
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="mt-12 bg-gradient-to-r from-muted to-background dark:from-primary dark:to-primary rounded-xl p-6 border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <HugeiconsIcon icon={HeartIcon} size={20} className="text-destructive" />
          مشارکت در توسعه
        </h3>
        <p className="text-secondary-foreground mb-4">
          آیا ایده‌ای برای بهبود گنج دارید؟ یا می‌خواهید در توسعه آن مشارکت کنید؟
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="px-4 py-2 bg-primary text-primary-foreground dark:text-foreground rounded-lg hover:bg-primary dark:hover:bg-muted transition-colors text-sm font-medium"
          >
            تماس با من
          </Link>
          <Link
            href="/changelog"
            className="px-4 py-2 border border-input text-secondary-foreground rounded-lg hover:bg-muted dark:hover:bg-primary transition-colors text-sm font-medium"
          >
            تاریخچه تغییرات
          </Link>
        </div>
      </div>
    </div>
  );
}
