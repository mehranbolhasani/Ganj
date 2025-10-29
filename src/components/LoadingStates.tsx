'use client';

import React from 'react';

// Skeleton loader for poem cards
export function PoemCardSkeleton() {
  return (
    <div className="p-4 bg-white/50 border border-white rounded-2xl shadow-lg/5 dark:bg-stone-800/50 dark:border-stone-700 animate-pulse">
      <div className="space-y-3">
        <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded w-3/4"></div>
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-1/2"></div>
      </div>
    </div>
  );
}

// Skeleton loader for category cards
export function CategoryCardSkeleton() {
  return (
    <div className="p-4 bg-white/50 border border-white rounded-2xl shadow-lg/5 dark:bg-stone-800/50 dark:border-stone-700 animate-pulse">
      <div className="space-y-3">
        <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded w-2/3"></div>
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-1/3"></div>
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-1/4"></div>
      </div>
    </div>
  );
}

// Skeleton loader for chapter cards
export function ChapterCardSkeleton() {
  return (
    <div className="p-4 bg-white/50 border border-white rounded-2xl shadow-lg/5 dark:bg-stone-800/50 dark:border-stone-700 animate-pulse">
      <div className="space-y-3">
        <div className="h-5 bg-stone-200 dark:bg-stone-700 rounded w-4/5"></div>
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-1/3"></div>
      </div>
    </div>
  );
}

// Skeleton loader for poet cards
export function PoetCardSkeleton() {
  return (
    <div className="p-6 bg-white/50 border border-white rounded-2xl shadow-lg/5 dark:bg-stone-800/50 dark:border-stone-700 animate-pulse">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-stone-200 dark:bg-stone-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded w-2/3"></div>
            <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-full"></div>
          <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-3/4"></div>
        </div>
      </div>
    </div>
  );
}

// Skeleton loader for pagination
export function PaginationSkeleton() {
  return (
    <div className="flex items-center justify-center gap-2 animate-pulse">
      <div className="w-16 h-8 bg-stone-200 dark:bg-stone-700 rounded"></div>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-8 h-8 bg-stone-200 dark:bg-stone-700 rounded"></div>
        ))}
      </div>
      <div className="w-16 h-8 bg-stone-200 dark:bg-stone-700 rounded"></div>
    </div>
  );
}

// Skeleton loader for breadcrumbs
export function BreadcrumbsSkeleton() {
  return (
    <div className="flex items-center gap-2 animate-pulse">
      <div className="w-4 h-4 bg-stone-200 dark:bg-stone-700 rounded"></div>
      <div className="w-16 h-4 bg-stone-200 dark:bg-stone-700 rounded"></div>
      <div className="w-4 h-4 bg-stone-200 dark:bg-stone-700 rounded"></div>
      <div className="w-20 h-4 bg-stone-200 dark:bg-stone-700 rounded"></div>
    </div>
  );
}

// Skeleton loader for search results
export function SearchResultSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-5 bg-stone-200 dark:bg-stone-700 rounded w-1/4"></div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-3 bg-stone-100 dark:bg-stone-800 rounded-lg">
            <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Loading spinner
export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`animate-spin ${sizeClasses[size]} ${className}`}>
      <svg className="w-full h-full text-stone-600 dark:text-stone-400" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

// Loading overlay
export function LoadingOverlay({ message = 'در حال بارگذاری...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-stone-800 rounded-xl p-6 flex items-center gap-3">
        <LoadingSpinner />
        <span className="text-stone-700 dark:text-stone-300">{message}</span>
      </div>
    </div>
  );
}

// Page loading skeleton
export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <BreadcrumbsSkeleton />
      <div className="h-8 bg-stone-200 dark:bg-stone-700 rounded w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <PoemCardSkeleton key={i} />
        ))}
      </div>
      <PaginationSkeleton />
    </div>
  );
}

// Suspense fallback component
export function SuspenseFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-stone-600 dark:text-stone-400">در حال بارگذاری...</p>
      </div>
    </div>
  );
}
