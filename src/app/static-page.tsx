export default function StaticPage() {
  return (
    <div className="w-full">
      {/* Static Content */}
      <div className="relative w-full">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-4">
            دفتر گنج
          </h1>
          <p className="text-stone-600 dark:text-stone-300">
            مجموعه‌ای از بهترین اشعار فارسی
          </p>
          <div className="mt-8">
            <p className="text-stone-500 dark:text-stone-400">
              این صفحه برای تست React refresh error ایجاد شده است.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
