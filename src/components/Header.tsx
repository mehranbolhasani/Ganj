import Link from 'next/link';
import PoetsDropdown from './PoetsDropdown';

export default function Header() {

  return (
    <header className="w-full sm:container-responsive min-h-[80px] h-[80px] md:min-h-[128px] md:h-[128px] flex items-center justify-between z-10 flex-row-reverse relative">
      {/* Left side - Navigation */}
      <div className="flex items-center gap-4 flex-row-reverse">
        {/* Navigation menu */}
        <nav className="flex items-center gap-1 flex-row-reverse">
          <Link
            href="/about"
            className="px-4 py-2 rounded-md text-md font-normal text-stone-900 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-800 transition-colors"
          >
            درباره
          </Link>
          <PoetsDropdown />
        </nav>
      </div>

      {/* Right side - Logo */}
      <div className="flex items-center gap-1 flex-row-reverse">
        <Link href="/" className="flex items-center gap-2 flex-row-reverse">
          <span className="text-lg font-bold text-stone-900 dark:text-stone-300 translate-y-0.5">دفتر گنج</span>
          <div className="w-8 h-8 grid items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"><path fill="#1C1917" fillRule="evenodd" d="M5.333 0A5.333 5.333 0 0 0 0 5.333v13.334A5.333 5.333 0 0 0 5.333 24h13.334A5.333 5.333 0 0 0 24 18.667V5.333A5.333 5.333 0 0 0 18.667 0H5.333Zm0 3.333a2 2 0 0 0-2 2v13.334a2 2 0 0 0 2 2H10a2 2 0 0 0 2-2V5.333a2 2 0 0 0-2-2H5.333Z" clipRule="evenodd"/></svg>
          </div>
        </Link>
      </div>
    </header>
  );
}