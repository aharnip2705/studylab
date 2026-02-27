import { VideolarClient } from "./videolar-client";

export default function VideolarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Video Dersler
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Dikkat dağıtıcısız, odak modunda video dersler. Arayın ve kaydedin.
        </p>
      </div>

      <VideolarClient />
    </div>
  );
}
