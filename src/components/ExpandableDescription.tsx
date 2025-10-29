'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableDescriptionProps {
  description: string;
  isFamous?: boolean;
  maxLength?: number;
}

export default function ExpandableDescription({ 
  description, 
  isFamous = false, 
  maxLength = 300 
}: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if description is long enough to need truncation
  const needsTruncation = description.length > maxLength;
  
  // Get the truncated text
  const truncatedText = needsTruncation 
    ? description.substring(0, maxLength) + '...'
    : description;
  
  // Get the text to display
  const displayText = isExpanded || !needsTruncation 
    ? description 
    : truncatedText;

  return (
    <div className="text-md max-w-3xl mx-auto p-8 pb-4 leading-relaxed">
      <p className={`${
        isFamous 
          ? 'text-stone-800 dark:text-stone-300' 
          : 'text-stone-700 dark:text-stone-300'
      }`}>
        {displayText}
      </p>
      
      {needsTruncation && (
        <div className="flex justify-start mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`inline-flex items-center flex-row-reverse gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              isFamous
                ? 'bg-stone-200/75 dark:bg-amber-800/30 text-stone-600 dark:text-amber-300 hover:bg-amber-200/50 dark:hover:bg-amber-700/40'
                : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
            }`}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 translate-y-0.5" />
                کمتر
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 translate-y-0.5" />
                بیشتر
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
