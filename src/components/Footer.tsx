import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="container-responsive flex items-center justify-between px-4 py-4">
      {/* Left side - Version */}
      <Link
        href="/changelog"
        className="px-4 py-2 rounded-md text-sm text-stone-900 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-800 transition-colors"
      >
        نسخه ۰/۱
      </Link>

      {/* Right side - Navigation */}
      <nav className="flex items-center gap-1">
        <Link
          href="/roadmap"
          className="px-4 py-2 rounded-md text-sm text-stone-900 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-800 transition-colors"
        >
          نقشه راه
        </Link>
        
        <div className="w-2 h-px bg-stone-400 dark:bg-stone-600 mx-1"></div>
        
        <Link
          href="/contact"
          className="px-4 py-2 rounded-md text-sm text-stone-900 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-800 transition-colors"
        >
          تماس با من
        </Link>
        
        <div className="w-2 h-px bg-stone-400 dark:bg-stone-600 mx-1"></div>
        
        <Link
          href="https://ganjoor.net"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-md text-sm text-stone-900 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-800 transition-colors"
        >
          سایت گنجور
        </Link>
      </nav>
    </footer>
  );
}
