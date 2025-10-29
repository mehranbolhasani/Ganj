'use client';

import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import { userPreferences } from '@/lib/user-preferences';

export default function ThemeSync() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Sync user preferences with next-themes
    const preferences = userPreferences.getPreferences();
    
    if (preferences.theme === 'auto') {
      setTheme('system');
    } else {
      setTheme(preferences.theme);
    }
  }, [setTheme]);

  useEffect(() => {
    // Listen for theme changes from next-themes and update user preferences
    const handleThemeChange = (newTheme: string) => {
      if (newTheme === 'system') {
        userPreferences.updatePreference('theme', 'auto');
      } else if (newTheme === 'dark' || newTheme === 'light') {
        userPreferences.updatePreference('theme', newTheme as 'dark' | 'light');
      }
    };

    // Set up listener for theme changes
    const unsubscribe = userPreferences.addListener((preferences) => {
      if (preferences.theme === 'auto') {
        setTheme('system');
      } else {
        setTheme(preferences.theme);
      }
    });

    return unsubscribe;
  }, [setTheme]);

  return null; // This component doesn't render anything
}
