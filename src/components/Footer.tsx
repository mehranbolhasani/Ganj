import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative w-full max-w-[640px] flex items-center justify-between px-4 py-4">
      {/* Left side - Version */}
      <div className="px-4 py-2 rounded-md">
        <span className="text-sm text-[#21201c] dark:text-white">نسخه ۰/۱</span>
      </div>

      {/* Right side - Navigation */}
      <nav className="flex items-center gap-1">
        <Link
          href="/roadmap"
          className="px-4 py-2 rounded-md text-sm text-[#21201c] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          نقشه راه
        </Link>
        
        <div className="w-2 h-px bg-[#cfceca] mx-1"></div>
        
        <Link
          href="/contact"
          className="px-4 py-2 rounded-md text-sm text-[#21201c] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          تماس با من
        </Link>
        
        <div className="w-2 h-px bg-[#cfceca] mx-1"></div>
        
        <Link
          href="https://ganjoor.net"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-md text-sm text-[#21201c] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          سایت گنجور
        </Link>
      </nav>
    </footer>
  );
}
