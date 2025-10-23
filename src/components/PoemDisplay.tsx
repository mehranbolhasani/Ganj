import { Poem } from '@/lib/types';

interface PoemDisplayProps {
  poem: Poem;
}

export default function PoemDisplay({ poem }: PoemDisplayProps) {
  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="text-center mb-8">
        <h1 className="font-doran text-4xl font-black text-stone-900 dark:text-white mb-4 text-right">
          {poem.title}
        </h1>
        <p className="text-lg text-stone-600 dark:text-gray-400 font-normal text-right">
          {poem.poetName}
        </p>
        {poem.categoryTitle && (
          <p className="text-sm text-stone-500 dark:text-gray-500 mt-1 font-normal">
            از مجموعه: {poem.categoryTitle}
          </p>
        )}
      </div>
      
      <div className="bg-white/50 border border-white rounded-2xl shadow-lg/5 dark:bg-gray-800/50 dark:border-gray-700 p-8">
        <div className="prose prose-lg max-w-none text-center">
          {poem.verses.map((verse, index) => (
            <p 
              key={index}
              className="text-stone-900 dark:text-white leading-relaxed mb-4 text-lg text-right"
            >
              {verse}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
