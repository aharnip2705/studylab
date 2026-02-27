"use client";

import { useState, useEffect, useCallback } from "react";
import type { PracticeExam } from "@/lib/actions/practice-exams";
import { applyAiPlan } from "@/lib/actions/ai-plan";
import { revalidateKey } from "@/lib/swr/hooks";

interface AiInsightBubbleProps {
  exams: PracticeExam[];
  isPro: boolean;
  studyField: string | null;
}

interface AiPlanTask {
  subject: string;
  duration_minutes: number;
  description: string;
}

interface AiPlanDay {
  day: string;
  tasks: AiPlanTask[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  plan?: AiPlanDay[];
}

function ApplyPlanButton({ plan }: { plan: AiPlanDay[] }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [confirming, setConfirming] = useState(false);

  async function handleApply() {
    setStatus("loading");
    setConfirming(false);
    try {
      const result = await applyAiPlan(plan);
      if ("error" in result) {
        setStatus("error");
      } else {
        setStatus("done");
        revalidateKey("weeklyPlan");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="mt-2 text-xs font-medium text-emerald-400">
        Program haftalık plana eklendi! Mevcut görevler silindi.
      </p>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      {confirming ? (
        <>
          <p className="text-xs text-amber-400">
            ⚠ Mevcut görevler silinecektir. Onaylıyor musunuz?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={status === "loading"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/30 disabled:opacity-50"
            >
              {status === "loading" ? "Ekleniyor..." : "Evet, Uygula"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={status === "loading"}
              className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-300"
            >
              İptal
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-amber-400">⚠ Mevcut görevler silinecektir.</p>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/30"
          >
            Haftalık Plana Ekle
          </button>
        </>
      )}
      {status === "error" && (
        <button
          type="button"
          onClick={handleApply}
          className="text-xs text-rose-400 hover:underline"
        >
          Hata – Tekrar Dene
        </button>
      )}
    </div>
  );
}

const AI_CHAT_STORAGE_KEY = "studylab-ai-chat-messages";

function loadStoredMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AI_CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is ChatMessage =>
        m && typeof m === "object" && "role" in m && "content" in m
    ) as ChatMessage[];
  } catch {
    return [];
  }
}

function saveMessages(msgs: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AI_CHAT_STORAGE_KEY, JSON.stringify(msgs));
  } catch {
    // ignore
  }
}

export function AiInsightBubble({ exams, isPro, studyField }: AiInsightBubbleProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadStoredMessages());
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const fetchInsight = useCallback(async () => {
    if (!isPro || exams.length === 0) return;
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch("/api/ai-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          exams: exams.slice(0, 5).map((e) => ({
            name: e.exam_name,
            type: e.exam_type,
            correct: e.total_correct,
            wrong: e.total_wrong,
            time: e.total_time_minutes,
            subject_details: e.subject_details,
          })),
          studyField,
        }),
      });
      const data = (await res.json()) as { insight?: string | null; error?: string };
      if (!res.ok) throw new Error(data.error ?? "API hatası");
      setInsight(data.insight ?? null);
    } catch (e) {
      setInsight(null);
      setApiError(e instanceof Error ? e.message : "Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }, [exams, isPro, studyField]);

  useEffect(() => {
    fetchInsight();
  }, [fetchInsight]);

  const sendChatMessage = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput("");
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          message: text,
          messages,
          exams: exams.slice(0, 5).map((e) => ({
            name: e.exam_name,
            type: e.exam_type,
            correct: e.total_correct,
            wrong: e.total_wrong,
            time: e.total_time_minutes,
            subject_details: e.subject_details,
          })),
          studyField,
        }),
      });
      const data = (await res.json()) as { reply?: string | null; error?: string; plan?: AiPlanDay[] };
      const reply = data.reply ?? data.error ?? "Üzgünüm, yanıt oluşturamadım.";
      setMessages((m) => [...m, { role: "assistant" as const, content: reply, plan: data.plan }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Bağlantı hatası. Lütfen tekrar deneyin.";
      setMessages((m) => [...m, { role: "assistant" as const, content: msg }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, messages, exams, studyField]);

  if (!isPro) return null;
  if (exams.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 p-5">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-indigo-500/5 blur-2xl" />
      <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-indigo-500/5 blur-2xl" />

      <div className="relative flex items-start gap-3">
        <div className="shrink-0 rounded-xl bg-indigo-500/10 p-2.5">
          <svg
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 24 24"
            className="text-indigo-400"
          >
            <path
              fill="currentColor"
              d="M12 2l2.09 6.26L20.18 10l-4.63 3.82L16.72 20 12 16.27 7.28 20l1.17-6.18L3.82 10l6.09-1.74L12 2z"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              AI Mentör
            </span>
            <span className="rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-indigo-400">
              Pro
            </span>
          </div>
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400 [animation-delay:150ms]" />
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400 [animation-delay:300ms]" />
              <span className="text-xs text-slate-500">Analiz ediliyor...</span>
            </div>
          ) : insight ? (
            <p className="text-sm leading-relaxed text-slate-300">{insight}</p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-slate-500">Analiz yüklenemedi.</p>
              {apiError && <p className="text-xs text-rose-400">{apiError}</p>}
              <button
                onClick={() => fetchInsight()}
                className="rounded-lg bg-indigo-500/20 px-2 py-1 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/30"
              >
                Tekrar dene
              </button>
            </div>
          )}

          {/* Konuşma geçmişi */}
          {messages.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-slate-700/50 pt-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-sm ${msg.role === "user" ? "text-right" : "text-left"}`}
                >
                  <span
                    className={`inline-block max-w-[90%] whitespace-pre-wrap break-words rounded-xl px-3 py-1.5 ${
                      msg.role === "user"
                        ? "bg-indigo-500/20 text-indigo-200"
                        : "bg-slate-700/50 text-slate-300"
                    }`}
                  >
                    {msg.content}
                  </span>
                  {msg.plan && msg.plan.length > 0 && (
                    <ApplyPlanButton plan={msg.plan} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Giriş alanı */}
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
              placeholder="Koça bir şey sor..."
              className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-indigo-500"
              disabled={chatLoading}
            />
            <button
              type="button"
              onClick={sendChatMessage}
              disabled={!chatInput.trim() || chatLoading}
              className="shrink-0 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:opacity-50"
            >
              {chatLoading ? "..." : "Gönder"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
