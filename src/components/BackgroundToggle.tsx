'use client';

import { useState } from 'react';
import { Palette, Sparkles, Waves } from 'lucide-react';

type BackgroundType = 'none' | 'aurora' | 'particles' | 'gradient';

export default function BackgroundToggle() {
  const [backgroundType, setBackgroundType] = useState<BackgroundType>('aurora');

  const backgrounds = [
    { type: 'none' as const, label: 'بدون پس‌زمینه', icon: Palette },
    { type: 'aurora' as const, label: 'شفق قطبی', icon: Waves },
    { type: 'particles' as const, label: 'ذرات', icon: Sparkles },
    { type: 'gradient' as const, label: 'گرادیان', icon: Palette },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-stone-200 dark:border-gray-700">
        <div className="flex gap-1">
          {backgrounds.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setBackgroundType(type)}
              className={`p-2 rounded-md transition-colors ${
                backgroundType === type
                  ? 'bg-stone-200 dark:bg-gray-700 text-stone-900 dark:text-white'
                  : 'text-stone-600 dark:text-gray-400 hover:bg-stone-100 dark:hover:bg-gray-700'
              }`}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
