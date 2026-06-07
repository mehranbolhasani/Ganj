'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Poet } from '@/lib/types';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, Cancel01Icon, Search01Icon } from '@hugeicons/core-free-icons';

interface PoetSelectorProps {
  poets: Poet[];
  selectedPoetId?: number;
  onSelect: (poetId: number | undefined) => void;
  placeholder?: string;
}

// Get the first letter of a Persian name for grouping
const getFirstLetter = (name: string): string => {
  if (!name || name.length === 0) return 'سایر';
  
  // Get first character
  const firstChar = name.trim()[0];
  
  // Persian alphabet ranges
  const persianLetters = 'آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی';
  
  // Check if it's a Persian letter
  if (persianLetters.includes(firstChar)) {
    return firstChar;
  }
  
  // Check if it's a number
  if (/[۰-۹0-9]/.test(firstChar)) {
    return '۰-۹';
  }
  
  // Default to 'سایر' (Other)
  return 'سایر';
};

const PoetSelector = ({ poets, selectedPoetId, onSelect, placeholder = 'همه شاعران' }: PoetSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get selected poet name
  const selectedPoet = poets.find(p => p.id === selectedPoetId);

  // Group poets by first letter
  const groupedPoets = useMemo(() => {
    const groups: Record<string, Poet[]> = {};
    
    poets.forEach(poet => {
      const letter = getFirstLetter(poet.name);
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(poet);
    });
    
    // Sort groups by Persian alphabet order
    const persianOrder = 'آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی۰-۹سایر';
    const sortedGroups = Object.entries(groups).sort((a, b) => {
      const indexA = persianOrder.indexOf(a[0]);
      const indexB = persianOrder.indexOf(b[0]);
      if (indexA === -1 && indexB === -1) return a[0].localeCompare(b[0]);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
    
    // Sort poets within each group
    sortedGroups.forEach(([, poetsList]) => {
      poetsList.sort((a, b) => a.name.localeCompare(b.name, 'fa'));
    });
    
    return sortedGroups;
  }, [poets]);

  // Filter grouped poets by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedPoets;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered: Array<[string, Poet[]]> = [];
    
    groupedPoets.forEach(([letter, poetsList]) => {
      const matchingPoets = poetsList.filter(poet => 
        poet.name.toLowerCase().includes(query)
      );
      if (matchingPoets.length > 0) {
        filtered.push([letter, matchingPoets]);
      }
    });
    
    return filtered;
  }, [groupedPoets, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (poetId: number | undefined) => {
    onSelect(poetId);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={dropdownRef} className="relative flex-1">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm bg-muted dark:bg-secondary border border-input rounded-lg text-foreground hover:bg-muted dark:hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0 flex-1 text-right">
          {selectedPoet ? (
            <span className="truncate">{selectedPoet.name}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selectedPoetId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(undefined);
              }}
              className="p-0.5 rounded hover:bg-muted dark:hover:bg-muted transition-colors"
              aria-label="حذف انتخاب"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} />
            </button>
          )}
          <HugeiconsIcon icon={ArrowDown01Icon} size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 max-h-[400px] flex flex-col overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <HugeiconsIcon icon={Search01Icon} size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="جستجو در شاعران..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full pr-8 pl-3 py-2 text-sm bg-background border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Poets List - Scrollable */}
          <div className="overflow-y-auto flex-1">
            {filteredGroups.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                هیچ شاعری یافت نشد
              </div>
            ) : (
              <>
                {/* "All Poets" option */}
                <button
                  onClick={() => handleSelect(undefined)}
                  className={`w-full text-right px-4 py-2 text-sm hover:bg-muted dark:hover:bg-secondary transition-colors ${
                    !selectedPoetId ? 'bg-muted dark:bg-secondary font-medium' : ''
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {!selectedPoetId && <span className="text-muted-foreground">✓</span>}
                    همه شاعران
                  </span>
                </button>
                <div className="border-t border-border my-1" />

                {/* Grouped Poets */}
                {filteredGroups.map(([letter, poetsList]) => (
                  <div key={letter} className="mb-1">
                    {/* Letter Header */}
                    <div className="sticky top-0 bg-background px-4 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border">
                      {letter}
                    </div>
                    
                    {/* Poets in this group */}
                    {poetsList.map((poet) => (
                      <button
                        key={poet.id}
                        onClick={() => handleSelect(poet.id)}
                        className={`w-full text-right px-4 py-2 text-sm hover:bg-muted dark:hover:bg-secondary transition-colors ${
                          selectedPoetId === poet.id ? 'bg-muted dark:bg-secondary font-medium' : ''
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {selectedPoetId === poet.id && (
                            <span className="text-muted-foreground">✓</span>
                          )}
                          {poet.name}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PoetSelector;

