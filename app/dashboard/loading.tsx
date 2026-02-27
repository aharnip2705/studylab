export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="grid grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
