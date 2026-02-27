export default function AyarlarLoading() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-8 w-32 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}
