'use client';

import { useTheme } from 'next-themes';
import { useEffect } from 'react';

export default function ThemeManager() {
  const { theme } = useTheme();

  useEffect(() => {
    // Ensure the HTML element has the correct theme class
    const html = document.documentElement;
    
    // Remove any existing theme classes
    html.classList.remove('light', 'dark');
    
    // Add the current theme class
    if (theme) {
      html.classList.add(theme);
    } else {
      html.classList.add('light'); // Default to light
    }
    
    console.log('ThemeManager: Applied theme', theme, 'to HTML element');
    console.log('HTML classes after update:', html.className);
  }, [theme]);

  return null; // This component doesn't render anything
}
