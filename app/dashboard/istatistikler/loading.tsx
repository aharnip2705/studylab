export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}
