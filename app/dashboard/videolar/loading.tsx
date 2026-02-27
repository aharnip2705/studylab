export default function VideolarLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="h-96 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}
