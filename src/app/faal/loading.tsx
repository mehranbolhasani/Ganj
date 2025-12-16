export default function FaalLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      {/* Skeleton for landing page */}
      <div className="relative mb-8">
        <div className="w-20 h-20 bg-stone-200 dark:bg-stone-700 rounded-full animate-pulse" />
      </div>
      
      <div className="h-14 w-48 bg-stone-200 dark:bg-stone-700 rounded-lg animate-pulse mb-4" />
      <div className="h-6 w-64 bg-stone-200 dark:bg-stone-700 rounded animate-pulse mb-2" />
      <div className="h-5 w-80 bg-stone-200 dark:bg-stone-700 rounded animate-pulse mb-12" />
      
      <div className="h-16 w-48 bg-amber-200 dark:bg-amber-800/30 rounded-2xl animate-pulse" />
    </div>
  );
}

