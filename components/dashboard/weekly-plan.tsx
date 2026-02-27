import { getOrCreateWeeklyPlan } from "@/lib/actions/plans";
import { DraggableWeeklyPlan } from "./draggable-weekly-plan";

const DAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

export async function WeeklyPlan() {
  const { plan, tasks } = await getOrCreateWeeklyPlan();

  if (!plan) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-slate-500">Plan yüklenemedi. Lütfen giriş yapın.</p>
      </div>
    );
  }

  const weekStart = new Date(plan.week_start_date);
  const days: { date: string; dayOfWeek: number; dayName: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push({
      date: d.toISOString().split("T")[0],
      dayOfWeek: i + 1,
      dayName: DAY_NAMES[i],
    });
  }

  const norm = (s: string | null | undefined) =>
    s ? s.split("T")[0] : "";
  const tasksByDateRecord: Record<string, typeof tasks> = {};
  for (const day of days) {
    tasksByDateRecord[day.date] = tasks.filter(
      (t: { task_date: string }) => norm(t.task_date) === day.date
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {weekStart.toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          haftası
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
          Görevleri sürükleyerek günler arasında taşıyabilirsiniz.
        </p>
      </div>

      <DraggableWeeklyPlan
        planId={plan.id}
        days={days}
        initialTasksByDateRecord={tasksByDateRecord}
      />
    </div>
  );
}
