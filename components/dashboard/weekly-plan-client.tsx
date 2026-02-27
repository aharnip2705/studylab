"use client";

import { useWeeklyPlan } from "@/lib/swr/hooks";
import { DraggableWeeklyPlan } from "./draggable-weekly-plan";

const DAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

export function WeeklyPlanClient() {
  const { data, error, isLoading, mutate } = useWeeklyPlan();

  if (error) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-red-500">Plan yüklenirken hata oluştu.</p>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  const { plan, tasks } = data ?? { plan: null, tasks: [] };

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
        onMutate={mutate}
      />
    </div>
  );
}
