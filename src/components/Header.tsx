'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { BookOpenCheck, Moon, Sun} from 'lucide-react';
import PoetsDropdown from './PoetsDropdown';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <header className="top-0 transform w-full max-w-[640px] min-h-[128px] h-[128px] flex items-center justify-between z-10 flex-row-reverse relative">
      {/* Left side - Navigation */}
      <div className="flex items-center gap-4 flex-row-reverse">
        {/* Moon icon for theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-4 h-4 flex items-center justify-center"
        >
          {theme === 'dark' ? (
            <Moon className="w-6 h-6 text-stone-900" />
          ) : (
            <Sun className="w-6 h-6 text-stone-900" />
          )}
        </button>

        {/* Navigation menu */}
        <nav className="flex items-center gap-1 flex-row-reverse">
          <Link
            href="/about"
            className="px-4 py-2 rounded-md text-md font-normal text-stone-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            درباره
          </Link>
          <PoetsDropdown />
        </nav>
      </div>

      {/* Right side - Logo */}
      <div className="flex items-center gap-1 flex-row-reverse">
        <Link href="/" className="flex items-center gap-1 flex-row-reverse">
          <span className="font-doran text-xl font-bold text-stone-900 dark:text-white">زرنور</span>
          <div className="w-8 h-8 grid items-center justify-center">
            <BookOpenCheck className="w-6 h-6 text-stone-900 mx-auto" />
          </div>
        </Link>
      </div>
    </header>
  );
}