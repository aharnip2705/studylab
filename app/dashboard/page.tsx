import { WeeklyPlanClient } from "@/components/dashboard/weekly-plan-client";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Haftalık Plan
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Görevlere tıklayarak durumunu güncelleyebilirsiniz (Tamamlandı / Kısmen
          / Tamamlanmadı)
        </p>
      </div>

      <WeeklyPlanClient />
    </div>
  );
}
