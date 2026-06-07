export default function StaticPage() {
  return (
    <div className="w-full">
      {/* Static Content */}
      <div className="relative w-full">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            دفتر گنج
          </h1>
          <p className="text-muted-foreground dark:text-secondary-foreground">
            مجموعه‌ای از بهترین اشعار فارسی
          </p>
          <div className="mt-8">
            <p className="text-muted-foreground">
              این صفحه برای تست React refresh error ایجاد شده است.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
