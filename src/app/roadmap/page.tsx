'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Clock, Search, Bookmark, Share, Filter, Users, Heart, Eye, Smartphone } from 'lucide-react';

export default function RoadmapPage() {
  const [activeTab, setActiveTab] = useState<'current' | 'upcoming'>('current');

  const currentFeatures = [
    {
      icon: Search,
      title: 'جستجوی پیشرفته',
      description: 'جستجو در شعرها، شاعران و دسته‌بندی‌ها با فیلترهای هوشمند',
      status: 'completed',
      progress: 100
    },
    {
      icon: Bookmark,
      title: 'سیستم علاقه‌مندی‌ها',
      description: 'ذخیره و مدیریت شعرهای مورد علاقه با امکان دسته‌بندی',
      status: 'completed',
      progress: 100
    },
    {
      icon: Eye,
      title: 'تاریخچه بازدیدها',
      description: 'پیگیری شعرهای خوانده شده و پیشنهاد محتوا',
      status: 'completed',
      progress: 100
    },
    {
      icon: Smartphone,
      title: 'بهینه‌سازی موبایل',
      description: 'تجربه کاربری بهتر در دستگاه‌های موبایل',
      status: 'completed',
      progress: 100
    }
  ];

  const upcomingFeatures = [
    {
      icon: Filter,
      title: 'فیلترهای پیشرفته',
      description: 'فیلتر بر اساس دوره تاریخی، موضوع، و ویژگی‌های شعر',
      status: 'in-progress',
      progress: 60,
      eta: 'نوامبر ۲۰۲۵'
    },
    {
      icon: Share,
      title: 'اشتراک‌گذاری شعرها',
      description: 'اشتراک‌گذاری شعرها در شبکه‌های اجتماعی و پیام‌رسان‌ها',
      status: 'in-progress',
      progress: 40,
      eta: 'نوامبر ۲۰۲۵'
    },
    {
      icon: Users,
      title: 'حساب کاربری',
      description: 'ثبت‌نام و ورود برای همگام‌سازی داده‌ها',
      status: 'planned',
      progress: 0,
      eta: 'دسامبر ۲۰۲۵'
    },
    {
      icon: Users,
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
          className="inline-flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 rotate-180" />
          بازگشت به صفحه اصلی
        </Link>
        
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-abar abar-wght-700 text-stone-900 dark:text-stone-100 mb-4">
              نقشه راه گنج
            </h1>
            <p className="text-stone-600 dark:text-stone-300 text-lg">
              برنامه‌ریزی آینده و ویژگی‌های در حال توسعه
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 bg-stone-100 dark:bg-stone-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('current')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'current'
              ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          ویژگی‌های فعلی
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'upcoming'
              ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          برای آینده
        </button>
      </div>

      {/* Current Features */}
      {activeTab === 'current' && (
        <div className="space-y-6">
          <div className="bg-green-50/50 dark:bg-green-950/40 rounded-xl p-4 border border-green-200 dark:border-green-800/50">
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              ویژگی‌های تکمیل شده
            </h2>
            <p className="text-stone-700 dark:text-stone-300 mb-6">
              این ویژگی‌ها در حال حاضر در گنج موجودن و می‌تونید ازشون استفاده کنید.
            </p>
            
            <div className="grid md:grid-cols-1 gap-4">
              {currentFeatures.map((feature, index) => (
                <div key={index} className="bg-white dark:bg-stone-800 rounded-lg p-4 border border-stone-200 dark:border-stone-700">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">
                        {feature.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}>
                          {getStatusText(feature.status)}
                        </span>
                        <div className="flex-1 bg-stone-200 dark:bg-stone-700 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${feature.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                          {feature.progress}%
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
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              ویژگی‌های در حال توسعه
            </h2>
            <p className="text-stone-700 dark:text-stone-300 mb-6">
              این ویژگی‌ها در حال توسعه هستن و به زودی در دسترس قرار خواهند گرفت.
            </p>
            
            <div className="space-y-4">
              {upcomingFeatures.map((feature, index) => (
                <div key={index} className="bg-white dark:bg-stone-800 rounded-lg p-4 border border-stone-200 dark:border-stone-700">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                          {feature.title}
                        </h3>
                        <span className="text-sm text-stone-500 dark:text-stone-400">
                          {feature.eta}
                        </span>
                      </div>
                      <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
                        {feature.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}>
                          {getStatusText(feature.status)}
                        </span>
                        <div className="flex-1 bg-stone-200 dark:bg-stone-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${feature.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                          {feature.progress}%
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
      <div className="mt-12 bg-gradient-to-r from-stone-50 to-stone-100 dark:from-stone-800 dark:to-stone-900 rounded-xl p-6 border border-stone-200 dark:border-stone-700">
        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-600" />
          مشارکت در توسعه
        </h3>
        <p className="text-stone-700 dark:text-stone-300 mb-4">
          آیا ایده‌ای برای بهبود گنج دارید؟ یا می‌خواهید در توسعه آن مشارکت کنید؟
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors text-sm font-medium"
          >
            تماس با من
          </Link>
          <Link
            href="/changelog"
            className="px-4 py-2 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-sm font-medium"
          >
            تاریخچه تغییرات
          </Link>
        </div>
      </div>
    </div>
  );
}
