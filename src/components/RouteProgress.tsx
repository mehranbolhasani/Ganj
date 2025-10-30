'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function RouteProgress(): JSX.Element {
  const pathname = usePathname();
  const [isActive, setIsActive] = React.useState(false);

  // Show a short progress bar on pathname change
  const lastPathRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (lastPathRef.current === null) {
      lastPathRef.current = pathname;
      return;
    }

    if (pathname !== lastPathRef.current) {
      lastPathRef.current = pathname;
      setIsActive(true);
      const minDuration = 350; // ensure visible feedback
      const timer = setTimeout(() => setIsActive(false), minDuration);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return (
    <div
      aria-hidden
      className={`fixed top-0 left-0 right-0 z-[60] h-0.5 overflow-hidden transition-opacity ${
        isActive ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className="h-full bg-stone-900 dark:bg-stone-100 origin-left animate-[routeProgress_0.6s_ease-out]"
        style={{ transform: isActive ? 'scaleX(1)' : 'scaleX(0)' }}
      />
      <style jsx>{`
        @keyframes routeProgress {
          0% { transform: scaleX(0); }
          60% { transform: scaleX(0.7); }
          100% { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}


