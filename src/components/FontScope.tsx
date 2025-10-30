'use client';

import React from 'react';

type FontScopeProps = {
  children: React.ReactNode;
  weight?: number; // 100–950
  contrast?: number; // 0–100 (CNTR)
  className?: string;
};

export default function FontScope({ children, weight, contrast, className }: FontScopeProps) {
  const style: React.CSSProperties & { '--abar-wght'?: number; '--abar-cntr'?: number } = {};
  if (typeof weight === 'number') style['--abar-wght'] = weight;
  if (typeof contrast === 'number') style['--abar-cntr'] = contrast;

  return (
    <div className={`font-abar ${className ?? ''}`} style={style}>
      {children}
    </div>
  );
}


