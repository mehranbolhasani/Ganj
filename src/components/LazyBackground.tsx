'use client';

import { lazy, Suspense } from 'react';

// Lazy load background components
const ParticleBackground = lazy(() => import('./ParticleBackground'));
const AuroraBackground = lazy(() => import('./AuroraBackground'));
const GradientBackground = lazy(() => import('./GradientBackground'));

interface LazyBackgroundProps {
  type: 'particles' | 'aurora' | 'gradient' | 'none';
}

export default function LazyBackground({ type }: LazyBackgroundProps) {
  if (type === 'none') {
    return null;
  }

  const BackgroundComponent = {
    particles: ParticleBackground,
    aurora: AuroraBackground,
    gradient: GradientBackground,
  }[type];

  return (
    <Suspense fallback={<div className="fixed inset-0 bg-stone-100 dark:bg-gray-900" />}>
      <BackgroundComponent />
    </Suspense>
  );
}
