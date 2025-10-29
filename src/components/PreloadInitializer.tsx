'use client';

import React from 'react';
import { initializePreloading } from '@/lib/lazy-loading';

export default function PreloadInitializer() {
  React.useEffect(() => {
    initializePreloading();
  }, []);
  
  return null;
}


