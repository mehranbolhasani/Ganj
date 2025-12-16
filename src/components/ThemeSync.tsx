'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { userPreferences } from '@/lib/user-preferences';

export default function ThemeSync() {
  const { setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    // Mark as mounted in next tick to avoid synchronous setState in effect
    requestAnimationFrame(() => {
      setIsMounted(true);
    });
    
    // Sync user preferences with next-themes on initial mount
    const preferences = userPreferences.getPreferences();
    
    if (preferences.theme === 'auto') {
      setTheme('system');
    } else {
      setTheme(preferences.theme);
    }
  }, [setTheme]);

  // Set up listener for theme changes from user preferences
  useEffect(() => {
    if (!isMounted) return;

    const unsubscribe = userPreferences.addListener((preferences) => {
      if (preferences.theme === 'auto') {
        setTheme('system');
      } else {
        setTheme(preferences.theme);
      }
    });

    return unsubscribe;
  }, [setTheme, isMounted]);

  return null; // This component doesn't render anything
}
