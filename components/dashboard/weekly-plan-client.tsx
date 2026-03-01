"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { getOrCreateWeeklyPlan, getWeeklyPlanByDate, getWeeklyPlanHistory, restoreWeeklyPlan } from "@/lib/actions/plans";
import { revalidateKey } from "@/lib/swr/hooks";
import { DraggableWeeklyPlan } from "./draggable-weekly-plan";
import { ChevronLeft, ChevronRight, History, RotateCcw, Calendar } from "lucide-react";

const DAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  d.setDate(diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dayNum = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dayNum}`;
}

function addWeeks(dateStr: string, weeks: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + weeks * 7);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + "T12:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${start.toLocaleDateString("tr-TR", opts)} – ${end.toLocaleDateString("tr-TR", { ...opts, year: "numeric" })}`;
}

export function WeeklyPlanClient() {
  const currentWeekStart = getWeekStart(new Date());
  const [selectedWeek, setSelectedWeek] = useState(currentWeekStart);
  const [showHistory, setShowHistory] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const isCurrentWeek = selectedWeek === currentWeekStart;

  const fetcher = useCallback(async () => {
    if (isCurrentWeek) return getOrCreateWeeklyPlan();
    return getWeeklyPlanByDate(selectedWeek);
  }, [selectedWeek, isCurrentWeek]);

  const { data, error, isLoading, mutate } = useSWR(
    `swr:weekly-plan:${selectedWeek}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000, keepPreviousData: true }
  );

  const { data: history, mutate: mutateHistory } = useSWR(
    showHistory ? "swr:plan-history" : null,
    getWeeklyPlanHistory,
    { revalidateOnFocus: false }
  );

  const handleRestore = async (sourceWeek: string) => {
    if (restoring) return;
    setRestoring(true);
    const result = await restoreWeeklyPlan(sourceWeek);
    setRestoring(false);
    if ("success" in result) {
      setSelectedWeek(currentWeekStart);
      setShowHistory(false);
      revalidateKey("weeklyPlan");
      mutate();
      mutateHistory();
    }
  };

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

  const weekStart = plan
    ? new Date(plan.week_start_date + "T12:00:00")
    : new Date(selectedWeek + "T12:00:00");

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

  const norm = (s: string | null | undefined) => (s ? s.split("T")[0] : "");
  const tasksByDateRecord: Record<string, typeof tasks> = {};
  for (const day of days) {
    tasksByDateRecord[day.date] = tasks.filter(
      (t: { task_date: string }) => norm(t.task_date) === day.date
    );
  }

  return (
    <div className="space-y-4">
      {/* Hafta Navigasyonu */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedWeek(addWeeks(selectedWeek, -1))}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            title="Önceki hafta"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="min-w-[200px] text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {formatWeekRange(selectedWeek)}
            </p>
            {isCurrentWeek && (
              <p className="text-xs text-indigo-500">Bu hafta</p>
            )}
            {!isCurrentWeek && (
              <p className="text-xs text-slate-500">Geçmiş hafta (salt okunur)</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))}
            disabled={selectedWeek >= currentWeekStart}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            title="Sonraki hafta"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {!isCurrentWeek && (
            <button
              type="button"
              onClick={() => setSelectedWeek(currentWeekStart)}
              className="ml-2 flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-400"
            >
              <Calendar className="h-3.5 w-3.5" />
              Bu Haftaya Dön
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isCurrentWeek && tasks.length > 0 && (
            <button
              type="button"
              onClick={() => handleRestore(selectedWeek)}
              disabled={restoring}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-500/20 disabled:opacity-50 dark:text-indigo-400"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {restoring ? "Geri yükleniyor..." : "Bu Haftaya Kopyala"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              showHistory
                ? "border-indigo-500 bg-indigo-500 text-white"
                : "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Geçmiş
          </button>
        </div>
      </div>

      {/* Geçmiş Arşivi */}
      {showHistory && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
            Haftalık Plan Arşivi
          </p>
          {!history ? (
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-48 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-500">Henüz geçmiş plan yok.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {history.map((h) => {
                const isSelected = h.week_start_date === selectedWeek;
                const isCurrent = h.week_start_date === currentWeekStart;
                return (
                  <button
                    key={h.week_start_date}
                    type="button"
                    onClick={() => setSelectedWeek(h.week_start_date)}
                    className={`flex flex-col rounded-lg border p-3 text-left text-xs transition-all ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className={`font-medium ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300"}`}>
                      {formatWeekRange(h.week_start_date)}
                      {isCurrent && <span className="ml-1.5 text-[10px] text-indigo-500">(bu hafta)</span>}
                    </span>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                      <span>{h.task_count} görev</span>
                      {h.completed > 0 && <span className="text-emerald-500">✓{h.completed}</span>}
                      {h.partial > 0 && <span className="text-amber-500">◐{h.partial}</span>}
                      {h.failed > 0 && <span className="text-rose-500">✗{h.failed}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Plan Grid veya Boş Durum */}
      {!plan || tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500">
            {isCurrentWeek
              ? "Bu hafta için henüz görev eklenmemiş."
              : "Bu hafta için plan bulunmuyor."}
          </p>
          {isCurrentWeek && (
            <p className="mt-1 text-xs text-slate-400">
              Görev ekle sayfasından veya AI Koç ile program oluşturabilirsiniz.
            </p>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            {isCurrentWeek
              ? "Görevleri sürükleyerek günler arasında taşıyabilirsiniz."
              : "Geçmiş haftayı görüntülüyorsunuz. Düzenleme yapılamaz."}
          </p>
          <DraggableWeeklyPlan
            planId={plan.id}
            days={days}
            initialTasksByDateRecord={tasksByDateRecord}
            onMutate={mutate}
            readOnly={!isCurrentWeek}
          />
        </>
      )}
    </div>
  );
}
