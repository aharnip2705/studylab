"use client";

import { useState } from "react";
import { X, Check, MessageSquare, Clock } from "lucide-react";
import { applyAiPlan } from "@/lib/actions/ai-plan";
import { revalidateKey } from "@/lib/swr/hooks";

interface AiPlanTask {
  subject: string;
  duration_minutes: number;
  description: string;
}

interface AiPlanDay {
  day: string;
  tasks: AiPlanTask[];
}

const DAY_ORDER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

const SUBJECT_COLORS: Record<string, string> = {
  "Türkçe": "from-blue-600/90 to-blue-500",
  "Matematik": "from-indigo-600/90 to-indigo-500",
  "Fizik": "from-orange-600/90 to-orange-500",
  "Kimya": "from-emerald-600/90 to-emerald-500",
  "Biyoloji": "from-green-600/90 to-green-500",
  "Edebiyat": "from-pink-600/90 to-pink-500",
  "Tarih": "from-amber-600/90 to-amber-500",
  "Coğrafya": "from-cyan-600/90 to-cyan-500",
  "Felsefe": "from-purple-600/90 to-purple-500",
};

function getSubjectGradient(subject: string): string {
  return `bg-gradient-to-br ${SUBJECT_COLORS[subject] ?? "from-slate-600/90 to-slate-500"}`;
}

interface PlanPreviewModalProps {
  plan: AiPlanDay[];
  onClose: () => void;
  onApplied: () => void;
  onRequestChange: (feedback: string) => void;
}

export function PlanPreviewModal({ plan, onClose, onApplied, onRequestChange }: PlanPreviewModalProps) {
  const [status, setStatus] = useState<"preview" | "loading" | "done" | "error" | "feedback">("preview");
  const [feedback, setFeedback] = useState("");

  const sortedPlan = [...plan].sort((a, b) => {
    const ai = DAY_ORDER.indexOf(a.day);
    const bi = DAY_ORDER.indexOf(b.day);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const totalTasks = sortedPlan.reduce((sum, d) => sum + d.tasks.length, 0);
  const totalMinutes = sortedPlan.reduce(
    (sum, d) => sum + d.tasks.reduce((s, t) => s + t.duration_minutes, 0),
    0
  );
  const totalHours = Math.floor(totalMinutes / 60);
  const remainMinutes = totalMinutes % 60;

  async function handleApply() {
    setStatus("loading");
    try {
      const result = await applyAiPlan(plan);
      if ("error" in result) {
        setStatus("error");
      } else {
        setStatus("done");
        revalidateKey("weeklyPlan");
        setTimeout(() => onApplied(), 800);
      }
    } catch {
      setStatus("error");
    }
  }

  function handleSendFeedback() {
    if (!feedback.trim()) return;
    onRequestChange(feedback.trim());
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-700/50 bg-slate-800/50 px-4 py-3 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-white sm:text-lg">Haftalık Program Önizleme</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {totalTasks} görev · Toplam {totalHours} sa {remainMinutes > 0 ? `${remainMinutes} dk` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Plan - 7 gün yatay tablo */}
        <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {sortedPlan.map((dayEntry) => {
              const dayMinutes = dayEntry.tasks.reduce((s, t) => s + t.duration_minutes, 0);
              return (
                <div
                  key={dayEntry.day}
                  className="flex min-w-[200px] max-w-[220px] flex-col rounded-xl border border-slate-700/50 bg-slate-800/40 shadow-lg"
                >
                  <div className="border-b border-slate-700/50 bg-slate-800/80 px-3 py-2.5">
                    <p className="font-semibold text-white">{dayEntry.day}</p>
                    <p className="text-[11px] text-slate-400">
                      {dayMinutes > 0 ? `${Math.floor(dayMinutes / 60)}sa ${dayMinutes % 60}dk` : "Dinlenme"}
                    </p>
                  </div>
                  <div className="flex-1 space-y-2 p-3">
                    {dayEntry.tasks.length === 0 ? (
                      <p className="py-6 text-center text-xs italic text-slate-500">Dinlenme</p>
                    ) : (
                      dayEntry.tasks.map((task, idx) => (
                        <div
                          key={idx}
                          className={`rounded-lg ${getSubjectGradient(task.subject)} p-3 text-white shadow`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">{task.subject}</span>
                            <span className="flex items-center gap-1 rounded bg-white/20 px-1.5 py-0.5 text-[11px]">
                              <Clock className="h-3 w-3" />
                              {task.duration_minutes}dk
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs leading-snug opacity-95">{task.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-700/50 bg-slate-800/50 px-4 py-3 sm:px-6">
          {status === "done" ? (
            <p className="text-center text-sm font-medium text-emerald-400">
              ✓ Program haftalık plana eklendi!
            </p>
          ) : status === "feedback" ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Neyi değiştirmemi istiyorsun? (ör: &quot;Matematik süresini artır&quot;, &quot;Pazar dinlenme olsun&quot;)
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendFeedback()}
                  placeholder="Değişiklik talebini yaz..."
                  className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-purple-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSendFeedback}
                  disabled={!feedback.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-400 disabled:opacity-40"
                >
                  <MessageSquare className="h-4 w-4" />
                  Gönder
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("preview")}
                  className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-300"
                >
                  Geri
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                ⚠ Onaylanırsa mevcut haftalık görevler bu programla değiştirilecek.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus("feedback")}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-600"
                >
                  <MessageSquare className="h-4 w-4" />
                  Değiştir
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={status === "loading"}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                >
                  {status === "loading" ? "Uygulanıyor..." : status === "error" ? "Tekrar Dene" : (
                    <>
                      <Check className="h-4 w-4" />
                      Onayla ve Uygula
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
