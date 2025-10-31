'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function RouteProgress(): JSX.Element | null {
  const pathname = usePathname();
  const [isActive, setIsActive] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  // Show a smooth progress bar on pathname change
  const lastPathRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (lastPathRef.current === null) {
      lastPathRef.current = pathname;
      return;
    }

    if (pathname !== lastPathRef.current) {
      lastPathRef.current = pathname;
      setIsActive(true);
      setProgress(0);
      
      // Simulate smooth progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          const increment = Math.random() * 15;
          return Math.min(prev + increment, 90);
        });
      }, 150);
      
      // Complete the progress bar
      const completeTimer = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsActive(false);
          setProgress(0);
        }, 200);
      }, 400);

      return () => {
        clearInterval(progressInterval);
        clearTimeout(completeTimer);
      };
    }
  }, [pathname]);

  if (!isActive) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-1">
      <div
        className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 shadow-lg shadow-yellow-500/30 transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? 'width 200ms ease-in, opacity 200ms' : 'width 200ms ease-out',
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}


