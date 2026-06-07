'use client';

import { useEffect, useState } from 'react';
import FaalHeader from '@/components/FaalHeader';
import FaalFooter from '@/components/FaalFooter';
import Particles from '@/components/Particles';
import { isWebGLSupported } from '@/lib/performance-detection';

export default function FaalLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  return (
    <div className="min-h-screen bg-amber-900 flex flex-col">
      {/* Particles Background */}
      {isMounted && isWebGLSupported() && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Particles
            particleColors={['#FFD22F', '#FFD22F']}
            particleCount={250}
            particleSpread={2}
            speed={0.1}
            particleBaseSize={25}
            moveParticlesOnHover={false}
            alphaParticles={false}
            disableRotation={false}
          />
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 w-full flex justify-start p-6 md:p-12">
        <FaalHeader />
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center w-full">
        <FaalFooter />
        {children}
      </main>
    </div>
  );
}
