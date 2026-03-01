"use client";

import { useState } from "react";
import { X, Check, MessageSquare, Clock, BookOpen } from "lucide-react";
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
  "Türkçe": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Matematik": "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  "Fizik": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Kimya": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Biyoloji": "bg-green-500/20 text-green-300 border-green-500/30",
  "Edebiyat": "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "Tarih": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "Coğrafya": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "Felsefe": "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

function getSubjectColor(subject: string): string {
  return SUBJECT_COLORS[subject] ?? "bg-slate-500/20 text-slate-300 border-slate-500/30";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10"
        style={{ background: "rgba(18, 18, 28, 0.97)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">Haftalık Program Önizleme</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {totalTasks} görev &middot; Toplam {totalHours}sa {remainMinutes > 0 ? `${remainMinutes}dk` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Plan Grid */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 160px)" }}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedPlan.map((dayEntry) => {
              const dayMinutes = dayEntry.tasks.reduce((s, t) => s + t.duration_minutes, 0);
              return (
                <div
                  key={dayEntry.day}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{dayEntry.day}</span>
                    <span className="text-[10px] text-slate-500">
                      {dayMinutes > 0 ? `${Math.floor(dayMinutes / 60)}sa ${dayMinutes % 60}dk` : "Dinlenme"}
                    </span>
                  </div>
                  {dayEntry.tasks.length === 0 ? (
                    <p className="text-xs text-slate-600 italic">Dinlenme günü</p>
                  ) : (
                    <div className="space-y-2">
                      {dayEntry.tasks.map((task, idx) => (
                        <div
                          key={idx}
                          className={`rounded-lg border p-2.5 ${getSubjectColor(task.subject)}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">{task.subject}</span>
                            <span className="flex items-center gap-1 text-[10px] opacity-70">
                              <Clock className="h-3 w-3" />
                              {task.duration_minutes}dk
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] opacity-80">{task.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-white/10 px-6 py-4">
          {status === "done" ? (
            <p className="text-center text-sm font-medium text-emerald-400">
              ✓ Program haftalık plana eklendi!
            </p>
          ) : status === "feedback" ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Neyi değiştirmemi istiyorsun? (ör: &quot;Matematik süresini artır&quot;, &quot;Pazar günü dinlenme olsun&quot;)
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendFeedback()}
                  placeholder="Değişiklik talebini yaz..."
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-purple-500/50"
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
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                ⚠ Onaylanırsa mevcut haftalık görevler bu programla değiştirilecek.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus("feedback")}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10"
                >
                  <MessageSquare className="h-4 w-4" />
                  Değiştir
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={status === "loading"}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 disabled:opacity-50"
                >
                  {status === "loading" ? (
                    "Uygulanıyor..."
                  ) : status === "error" ? (
                    "Tekrar Dene"
                  ) : (
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
