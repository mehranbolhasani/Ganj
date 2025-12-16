'use client';

import { useEffect, useState, useMemo } from 'react';
import FaalHeader from '@/components/FaalHeader';
import FaalFooter from '@/components/FaalFooter';
import Particles from '@/components/Particles';
import { debounce } from '@/lib/utils';
import { FaalState } from '@/lib/faal-types';
import { usePanelStyles } from '@/hooks/usePanelStyles';
import { getRecommendedParticleCount, isWebGLSupported } from '@/lib/performance-detection';

export default function FaalLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [faalState, setFaalState] = useState<FaalState>('landing');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Listen for state changes from children via custom event (temporary bridge)
  useEffect(() => {
    const handleStateChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ state: FaalState }>;
      if (customEvent.detail?.state && customEvent.detail.state !== 'transitioning') {
        setFaalState(customEvent.detail.state);
      }
    };

    window.addEventListener('faal-state-change', handleStateChange);

    return () => {
      window.removeEventListener('faal-state-change', handleStateChange);
    };
  }, []);

  // Set mobile state only on client-side to avoid hydration mismatch
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial value
    checkMobile();
    
    // Mark as mounted in next tick to avoid synchronous setState in effect
    requestAnimationFrame(() => {
      setIsMounted(true);
      
      // Fade out the preload background once content is ready
      const preloadBgEl = document.getElementById('faal-preload-bg');
      if (preloadBgEl) {
        preloadBgEl.style.opacity = '0';
      }
    });
    
    // Debounce resize listener to avoid excessive re-renders
    const debouncedCheckMobile = debounce(checkMobile, 150);
    window.addEventListener('resize', debouncedCheckMobile);
    
    return () => {
      window.removeEventListener('resize', debouncedCheckMobile);
    };
  }, []);

  // Get panel styles using custom hook
  const {
    rightPanelWidth,
    leftPanelWidth,
    rightPanelHeight,
    rightPanelMinHeight,
    leftPanelHeight,
    leftPanelMinHeight,
  } = usePanelStyles(faalState, isMounted, isMobile);

  // Optimize particle count based on device capabilities
  const particleCount = useMemo(() => {
    if (!isMounted) return 250; // Default during SSR
    return getRecommendedParticleCount(250);
  }, [isMounted]);

  // Check WebGL support
  const webGLSupported = useMemo(() => {
    if (!isMounted) return true; // Assume supported during SSR
    return isWebGLSupported();
  }, [isMounted]);

  return (
    <div 
      className="w-full mx-auto my-0 md:my-0 min-h-screen md:h-screen relative flex flex-col md:flex-row items-center justify-center bg-stone-950 dark:bg-stone-900 z-10 transition-colors duration-300"
    >
      {/* Right panel - main content area */}
      <div id="faalRight"
        className={`flex flex-col items-center justify-between bg-amber-900/50 backdrop-blur-xl relative overflow-hidden rounded-[2rem] md:rounded-[4rem] ml-0 md:-ml-8 z-20 w-[90%] md:w-[70%] min-h-[90vh] md:min-h-0 md:h-3/4 mt-4 md:mt-0 transition-opacity duration-300 opacity-100`}
        style={{
          ...(isMounted && rightPanelWidth && { width: rightPanelWidth }),
          ...(isMounted && rightPanelHeight && { height: rightPanelHeight }),
          ...(isMounted && rightPanelMinHeight && { minHeight: rightPanelMinHeight }),
          transition: 'width 1000ms ease-in-out, height 1000ms ease-in-out, min-height 1000ms ease-in-out, opacity 300ms ease-in-out'
        }}
      >
        {/* Particles Background - Only render if WebGL is supported */}
        {webGLSupported && (
          <div className="absolute inset-0 z-0">
            <Particles
              particleColors={['#FFD22F', '#FFD22F']}
              particleCount={particleCount}
              particleSpread={2}
              speed={0.1}
              particleBaseSize={25}
              moveParticlesOnHover={false}
              alphaParticles={false}
              disableRotation={false}
            />
          </div>
        )}

        {/* Custom Header for Faal page */}
        <div className="relative z-10 w-full flex justify-start p-12">
          <FaalHeader />
        </div>
        
        {/* Custom Footer for Faal page */}
        <div className="relative z-10 w-full">
          <FaalFooter />
        </div>

        <div className="w-1/2 h-64 absolute -bottom-16 z-1 flex opacity-80 left-1/2 -translate-x-1/2 blur-2xl">
          <div className="w-1/2 h-full bg-amber-700 rounded-full aspect-square min-w-0 -translate-x-8 blur-3xl opacity-60"></div>
          <div className="w-1/2 h-full bg-amber-500 rounded-full aspect-square min-w-0 -translate-x-8 blur-3xl opacity-80"></div>
          <div className="w-1/2 h-full bg-amber-300 rounded-full aspect-square min-w-0 z-10 blur-3xl"></div>
          <div className="w-1/2 h-full bg-amber-500 rounded-full aspect-square min-w-0 translate-x-8 blur-3xl opacity-80"></div>
          <div className="w-1/2 h-full bg-amber-700 rounded-full aspect-square min-w-0 translate-x-8 blur-3xl opacity-60"></div>
        </div>
      </div>

      {/* Left panel - page content */}
      <div 
        className={`flex items-center justify-center bg-amber-800/40 backdrop-blur-sm relative overflow-hidden rounded-b-[2rem] md:rounded-l-[4rem] mr-0 -mt-10 md:mt-0 md:-mr-24 z-10 w-[90%] md:w-[10%] min-h-[80px] md:min-h-0 md:h-3/4 mb-4 md:mb-0 transition-opacity duration-300 ${
          isMounted ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          ...(isMounted && leftPanelWidth && { width: leftPanelWidth }),
          ...(isMounted && leftPanelHeight && { height: leftPanelHeight }),
          ...(isMounted && leftPanelMinHeight && { minHeight: leftPanelMinHeight }),
          transition: 'width 1000ms ease-in-out, height 1000ms ease-in-out, min-height 1000ms ease-in-out, opacity 300ms ease-in-out'
        }}
      >
        {children}
      </div>
    </div>
  );
}
