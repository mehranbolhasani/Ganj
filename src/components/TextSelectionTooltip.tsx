'use client';

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink } from 'lucide-react';

interface TextSelectionTooltipProps {
  onClose: () => void;
  selectedText: string;
  position: { x: number; y: number };
}

const TextSelectionTooltip = ({ onClose, selectedText, position }: TextSelectionTooltipProps) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const [adjustedPosition, setAdjustedPosition] = useState<{ x: number; y: number } | null>(null);
  const [isPositioned, setIsPositioned] = useState(false);

  const calculatePosition = useCallback((pos: { x: number; y: number }, useActualDimensions: boolean = false) => {
    const padding = 10;
    // Increase padding on mobile for better touch targets
    const mobilePadding = window.innerWidth < 640 ? 15 : padding;
    let finalX = pos.x;
    let finalY: number;
    let tooltipWidth: number;
    let tooltipHeight: number;

    if (useActualDimensions && tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      tooltipWidth = tooltipRect.width;
      tooltipHeight = tooltipRect.height;
    } else {
      // Use estimated dimensions for initial calculation
      // Slightly larger on mobile
      tooltipWidth = window.innerWidth < 640 ? 240 : 220;
      tooltipHeight = window.innerWidth < 640 ? 50 : 45;
    }

    finalY = pos.y - tooltipHeight - mobilePadding;

    const halfTooltipWidth = tooltipWidth / 2;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontal position
    if (finalX - halfTooltipWidth < mobilePadding) {
      finalX = mobilePadding + halfTooltipWidth;
    } else if (finalX + halfTooltipWidth > viewportWidth - mobilePadding) {
      finalX = viewportWidth - mobilePadding - halfTooltipWidth;
    }

    // Adjust vertical position
    if (finalY < mobilePadding) {
      finalY = pos.y + mobilePadding;
    } else if (finalY + tooltipHeight > viewportHeight - mobilePadding) {
      finalY = viewportHeight - tooltipHeight - mobilePadding;
    }

    return { x: finalX, y: finalY };
  }, []);

  // Calculate position when position prop changes
  // Using useLayoutEffect and requestAnimationFrame to avoid synchronous setState issues
  useLayoutEffect(() => {
    // Cancel any pending RAF
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // Calculate initial position with estimated dimensions
    const initialPos = calculatePosition(position, false);
    
    // Use requestAnimationFrame to defer state updates
    rafIdRef.current = requestAnimationFrame(() => {
      setAdjustedPosition(initialPos);
      setIsPositioned(false);

      // Then refine with actual dimensions using double RAF for accurate measurement
      rafIdRef.current = requestAnimationFrame(() => {
        const finalPos = calculatePosition(position, true);
        setAdjustedPosition(finalPos);
        setIsPositioned(true);
        rafIdRef.current = null;
      });
    });

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [position, calculatePosition]);

  // Track scroll to update tooltip position
  useEffect(() => {
    if (!isPositioned) return;

    let rafId: number | null = null;
    let lastScrollY = window.scrollY;
    let lastScrollX = window.scrollX;

    const handleScroll = () => {
      // Only update if scroll position actually changed
      const currentScrollY = window.scrollY;
      const currentScrollX = window.scrollX;
      
      if (currentScrollY === lastScrollY && currentScrollX === lastScrollX) {
        return;
      }

      lastScrollY = currentScrollY;
      lastScrollX = currentScrollX;

      // Cancel previous RAF if pending
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      // Use RAF to throttle scroll updates
      rafId = requestAnimationFrame(() => {
        // Recalculate position based on current scroll
        // The position prop should be updated by parent, but we can also update here
        // by getting the current selection
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          try {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            if (rect.width > 0 && rect.height > 0) {
              const newPos = {
                x: rect.left + rect.width / 2,
                y: rect.top,
              };
              const adjustedPos = calculatePosition(newPos, true);
              setAdjustedPosition(adjustedPos);
            }
          } catch {
            // Selection might have changed, ignore
          }
        }
        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isPositioned, calculatePosition]);

  // Encode selected text for Vajehyab URL
  const vajehyabUrl = `https://vajehyab.com/?q=${encodeURIComponent(selectedText.trim())}`;

  // Don't render until position is calculated
  if (!adjustedPosition) return null;

  const tooltipContent = (
    <div
      ref={tooltipRef}
      className="fixed z-9999 bg-stone-900/80 dark:bg-stone-100/80 text-white dark:text-stone-900 rounded-xl shadow-lg p-2 flex items-center gap-2 pointer-events-auto transition-opacity duration-150 backdrop-blur-sm w-52"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        transform: 'translateX(-50%)',
        opacity: isPositioned ? 1 : 0,
      }}
      role="tooltip"
      aria-label="جستجوی معنی در واژه‌یاب"
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e: React.TouchEvent) => e.stopPropagation()}
    >
      <a
        href={vajehyabUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-yellow-700 dark:hover:bg-stone-200 active:bg-yellow-600 dark:active:bg-stone-300 transition-colors text-sm font-medium touch-manipulation min-h-[44px] min-w-[44px] justify-center w-full"
        onClick={(e) => {
          e.stopPropagation();
          // Close tooltip after a short delay to allow navigation
          setTimeout(() => onClose(), 100);
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          // Close tooltip after a short delay to allow navigation
          setTimeout(() => onClose(), 100);
        }}
        aria-label={`جستجوی معنی "${selectedText.trim()}" در واژه‌یاب`}
      >
        <span className="text-xs">جستجو در واژه‌یاب</span>
        <ExternalLink className="w-4 h-4" />
      </a>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="p-2 rounded-md hover:bg-stone-800 dark:hover:bg-stone-200 active:bg-stone-700 dark:active:bg-stone-300 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="بستن"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  // Render tooltip in a portal to body to avoid CSS filter issues
  if (typeof window === 'undefined') return null;
  
  return createPortal(tooltipContent, document.body);
};

export default TextSelectionTooltip;

