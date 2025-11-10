'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, CheckCircle } from 'lucide-react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {

    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      // Hide notification after 3 seconds
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showNotification) return null;

  return (
    <div
      className={`
        fixed top-4 left-0 z-50 max-w-11/12 w-full transform transition-all duration-300 ease-in-out
        ${showNotification ? 'translate-x-0 opacity-100' : 'translate-x-1/2 opacity-0'}
      `}
    >
      <div
        className={`
          flex items-center gap-3 p-4 rounded-lg shadow-lg border
          ${isOnline
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-800'
          }
        `}
      >
        <div className="flex-shrink-0">
          {isOnline ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
        </div>
        
        <div className="flex-1">
          <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100">
            {isOnline ? 'اتصال برقرار شد' : 'اتصال قطع شد'}
          </h4>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {isOnline
              ? 'شما دوباره آنلاین هستید'
              : 'لطفاً اتصال اینترنت خود را بررسی کنید'
            }
          </p>
        </div>

        <button
          onClick={() => setShowNotification(false)}
          className="flex-shrink-0 p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          aria-label="بستن اعلان"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default OfflineIndicator;
