"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { moveTask } from "@/lib/actions/plans";
import { TaskCard } from "./task-card";

const DAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

type Task = {
  id: string;
  task_date: string;
  day_of_week: number;
  subject_id: string;
  task_type: "video" | "test" | "deneme";
  resource_name: string | null;
  question_count: number | null;
  solved_questions_count: number | null;
  notes: string | null;
  excuse: string | null;
  status: "tamamlanmadi" | "kismen_tamamlandi" | "tamamlandi";
  subjects: { name: string; icon_url?: string | null } | null;
  resources: { name: string } | null;
  user_resources: { name: string } | null;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).getDate().toString();
}

interface DraggableWeeklyPlanProps {
  planId: string;
  days: { date: string; dayOfWeek: number; dayName: string }[];
  initialTasksByDateRecord: Record<string, Task[]>;
  onMutate?: () => void;
}

function getTodayDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DraggableWeeklyPlan({ planId, days, initialTasksByDateRecord, onMutate }: DraggableWeeklyPlanProps) {
  const router = useRouter();
  const todayStr = getTodayDateStr();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayColumnRef = useRef<HTMLDivElement>(null);
  const [tasksByDate, setTasksByDate] = useState<Map<string, Task[]>>(
    () => new Map(Object.entries(initialTasksByDateRecord ?? {}))
  );

  useEffect(() => {
    setTasksByDate(new Map(Object.entries(initialTasksByDateRecord ?? {})));
  }, [initialTasksByDateRecord]);

  // Auto-scroll to today on mount (mobile)
  useEffect(() => {
    const container = scrollContainerRef.current;
    const todayCol = todayColumnRef.current;
    if (!container || !todayCol) return;
    const containerLeft = container.getBoundingClientRect().left;
    const colLeft = todayCol.getBoundingClientRect().left;
    const scrollOffset = container.scrollLeft + (colLeft - containerLeft) - 16;
    container.scrollTo({ left: scrollOffset, behavior: "smooth" });
  }, []);

  const handleTaskDeleted = useCallback((taskId: string) => {
    setTasksByDate((prev) => {
      const next = new Map(prev);
      for (const [date, tasks] of next) {
        next.set(date, tasks.filter((t) => t.id !== taskId));
      }
      return next;
    });
  }, []);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.setData("application/json", JSON.stringify({ taskDate: task.task_date }));
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
    setDragOverDate(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, date: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(date);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const related = e.relatedTarget as Node;
    const current = e.currentTarget as HTMLElement;
    if (!current.contains(related)) setDragOverDate(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetDate: string) => {
      e.preventDefault();
      setDragOverDate(null);
      const taskId = e.dataTransfer.getData("text/plain");
      const day = days.find((d) => d.date === targetDate);
      if (!taskId || !day || !draggedTask || draggedTask.task_date === targetDate) {
        setDraggedTask(null);
        return;
      }
      const res = await moveTask(taskId, targetDate, day.dayOfWeek);
      if (!res.error) {
        setTasksByDate((prev) => {
          const next = new Map(prev);
          const fromList = (next.get(draggedTask.task_date) ?? []).filter((t) => t.id !== taskId);
          const toList = [...(next.get(targetDate) ?? []), { ...draggedTask, task_date: targetDate, day_of_week: day.dayOfWeek }];
          next.set(draggedTask.task_date, fromList);
          next.set(targetDate, toList);
          return next;
        });
        onMutate?.() ?? router.refresh();
      }
      setDraggedTask(null);
    },
    [days, draggedTask, router, onMutate]
  );

  return (
    <div ref={scrollContainerRef} className="weekly-plan-scroll -mx-2 snap-x snap-mandatory overflow-x-auto px-2 pb-2 scroll-smooth">
      <div className="flex gap-4">
        {days.map((day, idx) => {
          const dayTasks = tasksByDate.get(day.date) ?? [];
          const isDragOver = dragOverDate === day.date;
          const isToday = day.date === todayStr;
          return (
            <div
              key={day.date}
              ref={isToday ? todayColumnRef : undefined}
              onDragOver={(e) => handleDragOver(e, day.date)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day.date)}
              style={{ animationDelay: `${idx * 40}ms` }}
              className={`animate-item-in flex min-w-[280px] snap-start flex-col rounded-xl border-2 p-3 transition-colors ${
                isDragOver
                  ? "border-blue-500 bg-blue-100/80 dark:border-blue-400 dark:bg-blue-900/30"
                  : isToday
                    ? "border-indigo-500 bg-indigo-100/80 dark:border-indigo-400 dark:bg-indigo-900/30 shadow-lg shadow-indigo-500/20"
                    : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800/90"
              }`}
            >
              <div className={`mb-3 flex shrink-0 items-center justify-between border-b pb-2 ${isToday ? "border-indigo-200 dark:border-indigo-700/50" : "border-slate-200 dark:border-slate-700"}`}>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${isToday ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-white"}`}>{day.dayName}</span>
                  {isToday && (
                    <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-bold text-white">Bugün</span>
                  )}
                </div>
                <span className="shrink-0 text-xs text-slate-500">{formatDate(day.date)}</span>
              </div>
              <div className="min-h-[80px] flex-1 space-y-2 overflow-y-auto weekly-plan-scroll">
                {dayTasks.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">Görev yok — buraya sürükleyin</p>
                ) : (
                  dayTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      className={`cursor-grab active:cursor-grabbing ${draggedTask?.id === task.id ? "opacity-50" : ""}`}
                    >
                      <TaskCard
                        id={task.id}
                        subjectName={task.task_type === "deneme" ? "Deneme" : ((task.subjects as { name?: string } | null)?.name ?? "Ders")}
                        subjectIconUrl={(task.subjects as { icon_url?: string | null } | null)?.icon_url ?? null}
                        taskType={task.task_type}
                        resourceName={
                          (task.resources as { name?: string } | null)?.name ??
                          (task.user_resources as { name?: string } | null)?.name ??
                          task.resource_name
                        }
                        questionCount={task.question_count}
                        solvedQuestionsCount={task.solved_questions_count ?? null}
                        status={task.status}
                        notes={task.notes}
                        excuse={(task as { excuse?: string | null }).excuse ?? null}
                        onDeleted={handleTaskDeleted}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
