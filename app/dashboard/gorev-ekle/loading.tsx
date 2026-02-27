export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
