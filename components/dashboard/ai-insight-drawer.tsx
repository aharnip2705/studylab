"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Brain, Sparkles, Send, Loader2, Eye } from "lucide-react";
import type { PracticeExam } from "@/lib/actions/practice-exams";
import { revalidateKey } from "@/lib/swr/hooks";
import { PlanPreviewModal } from "./plan-preview-modal";

interface AiPlanTask {
  subject: string;
  duration_minutes: number;
  description: string;
}

interface AiPlanDay {
  day: string;
  tasks: AiPlanTask[];
}

const AI_CHAT_STORAGE_KEY = "studylab-ai-chat-v2";

function loadStoredMessages(): { id: string; role: "user" | "assistant"; content: string }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AI_CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is { id: string; role: "user" | "assistant"; content: string } =>
        m !== null &&
        typeof m === "object" &&
        "role" in (m as object) &&
        "content" in (m as object)
    );
  } catch {
    return [];
  }
}

function extractPlan(content: string): AiPlanDay[] | null {
  try {
    // İç içe JSON'u doğru yakalamak için parantez sayacı kullan
    const startIdx = content.indexOf('{"plan"');
    if (startIdx === -1) return null;
    let depth = 0;
    let end = -1;
    for (let i = startIdx; i < content.length; i++) {
      if (content[i] === "{") depth++;
      else if (content[i] === "}") {
        depth--;
        if (depth === 0) { end = i + 1; break; }
      }
    }
    if (end === -1) return null;
    const { plan } = JSON.parse(content.slice(startIdx, end)) as { plan: AiPlanDay[] };
    return Array.isArray(plan) && plan.length > 0 ? plan : null;
  } catch {
    return null;
  }
}

function ApplyPlanButton({ plan, onRequestChange }: { plan: AiPlanDay[]; onRequestChange?: (feedback: string) => void }) {
  const [showPreview, setShowPreview] = useState(false);
  const [applied, setApplied] = useState(false);

  if (applied) {
    return <p className="mt-2 text-xs font-medium text-emerald-400">✓ Haftalık plana eklendi!</p>;
  }

  return (
    <>
      <div className="mt-2">
        <button type="button" onClick={() => setShowPreview(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30">
          <Eye className="h-3.5 w-3.5" />
          Programı Önizle
        </button>
      </div>
      {showPreview && (
        <PlanPreviewModal
          plan={plan}
          onClose={() => setShowPreview(false)}
          onApplied={() => { setShowPreview(false); setApplied(true); }}
          onRequestChange={(fb) => { setShowPreview(false); onRequestChange?.(fb); }}
        />
      )}
    </>
  );
}

interface AiInsightDrawerProps {
  exams: PracticeExam[];
  isPro: boolean;
  studyField: string | null;
  tytTargetNet?: number | null;
  aytTargetNet?: number | null;
}

export function AiInsightDrawer({ exams, isPro, studyField, tytTargetNet, aytTargetNet }: AiInsightDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const insightFetchedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const examBody = exams.slice(0, 5).map((e) => ({
    name: e.exam_name,
    type: e.exam_type,
    correct: e.total_correct,
    wrong: e.total_wrong,
    time: e.total_time_minutes,
    subject_details: e.subject_details,
  }));

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    error,
  } = useChat({
    api: "/api/chat",
    initialMessages: loadStoredMessages(),
    body: { exams: examBody, studyField, tytTargetNet, aytTargetNet },
    onFinish: () => {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    },
    onError: (err) => {
      console.error("[AI chat]", err);
    },
  });

  // localStorage'a kaydet
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(
          AI_CHAT_STORAGE_KEY,
          JSON.stringify(
            messages.map((m) => ({ id: m.id, role: m.role, content: m.content }))
          )
        );
      } catch { /* ignore */ }
    }
  }, [messages]);

  // Drawer açılınca focus + scroll
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 320);
    }
  }, [isOpen]);

  // Escape ile kapat
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // AI hızlı tavsiye (insight card)
  useEffect(() => {
    if (!isOpen || insightFetchedRef.current || !isPro || exams.length === 0) return;
    insightFetchedRef.current = true;
    setInsightLoading(true);
    fetch("/api/ai-insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ exams: examBody, studyField }),
    })
      .then((r) => r.json())
      .then((data: { insight?: string; error?: string }) => setInsight(data.insight ?? null))
      .catch(() => {})
      .finally(() => setInsightLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function clearHistory() {
    setMessages([]);
    try { localStorage.removeItem(AI_CHAT_STORAGE_KEY); } catch { /* ignore */ }
  }

  function fillInput(text: string) {
    handleInputChange({ target: { value: text } } as React.ChangeEvent<HTMLInputElement>);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  if (!isPro) return null;

  const latestTytExam = exams.find((e) => e.exam_type === "tyt") ?? null;
  const latestAytExam = exams.find((e) => e.exam_type === "ayt") ?? null;

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
        style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)" }}
      >
        <Sparkles className="h-4 w-4" />
        AI Koç
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col"
              style={{ background: "rgba(18, 18, 28, 0.97)", backdropFilter: "blur(20px)" }}
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)" }}
                  >
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white">AI Mentör</h2>
                    <p className="text-xs text-slate-400">StudyLab Koçunuz</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                {/* Status Cards */}
                {(latestTytExam || latestAytExam) && (
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    {latestTytExam && (
                      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3">
                        <p className="text-xs font-semibold text-indigo-400">Son TYT</p>
                        <p className="mt-1 text-2xl font-bold text-white">
                          {(latestTytExam.total_correct - latestTytExam.total_wrong * 0.25).toFixed(1)}
                        </p>
                        <p className="text-xs text-slate-400">net</p>
                        {tytTargetNet != null && (
                          <div className="mt-2">
                            <div className="mb-1 flex justify-between text-[10px] text-slate-400">
                              <span>Hedef: {tytTargetNet % 1 === 0 ? Math.round(tytTargetNet) : tytTargetNet.toFixed(1)}</span>
                              <span>
                                {Math.min(
                                  100,
                                  Math.round(
                                    ((latestTytExam.total_correct - latestTytExam.total_wrong * 0.25) /
                                      tytTargetNet) *
                                      100
                                  )
                                )}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-white/10">
                              <div
                                className="h-1.5 rounded-full bg-indigo-500 transition-all"
                                style={{
                                  width: `${Math.min(100, ((latestTytExam.total_correct - latestTytExam.total_wrong * 0.25) / tytTargetNet) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {latestAytExam && (
                      <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-3">
                        <p className="text-xs font-semibold text-purple-400">Son AYT</p>
                        <p className="mt-1 text-2xl font-bold text-white">
                          {(latestAytExam.total_correct - latestAytExam.total_wrong * 0.25).toFixed(1)}
                        </p>
                        <p className="text-xs text-slate-400">net</p>
                        {aytTargetNet != null && (
                          <div className="mt-2">
                            <div className="mb-1 flex justify-between text-[10px] text-slate-400">
                              <span>Hedef: {aytTargetNet % 1 === 0 ? Math.round(aytTargetNet) : aytTargetNet.toFixed(1)}</span>
                              <span>
                                {Math.min(
                                  100,
                                  Math.round(
                                    ((latestAytExam.total_correct - latestAytExam.total_wrong * 0.25) /
                                      aytTargetNet) *
                                      100
                                  )
                                )}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-white/10">
                              <div
                                className="h-1.5 rounded-full bg-purple-500 transition-all"
                                style={{
                                  width: `${Math.min(100, ((latestAytExam.total_correct - latestAytExam.total_wrong * 0.25) / aytTargetNet) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* AI Tavsiye Card */}
                <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                      AI Tavsiye
                    </span>
                  </div>
                  {insightLoading ? (
                    <div className="flex items-center gap-2">
                      {[0, 150, 300].map((d) => (
                        <div
                          key={d}
                          className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400"
                          style={{ animationDelay: `${d}ms` }}
                        />
                      ))}
                      <span className="text-xs text-slate-500">Analiz ediliyor...</span>
                    </div>
                  ) : insight ? (
                    <p className="text-sm leading-relaxed text-slate-300">{insight}</p>
                  ) : exams.length === 0 ? (
                    <p className="text-sm text-slate-500">Deneme sonucu ekleyince analiz başlar.</p>
                  ) : (
                    <p className="text-sm text-slate-500">Analiz hazırlanamadı.</p>
                  )}
                </div>

                {/* Hata mesajı */}
                {error && (
                  <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
                    <p className="text-sm font-medium text-rose-400">
                      {error.message || "Bir hata oluştu. Lütfen tekrar deneyin."}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      API anahtarınızı (Vercel: GROQ_API_KEY) ve Pro aboneliğinizi kontrol edin.
                    </p>
                  </div>
                )}

                {/* Chat Mesajları */}
                {messages.length > 0 ? (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const plan = msg.role === "assistant" ? extractPlan(msg.content) : null;
                      const displayContent = plan
                        ? "✅ Haftalık programın hazır! Önizle butonuna tıklayarak programı inceleyebilir, onaylayabilir veya değişiklik isteyebilirsin."
                        : msg.content;

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {msg.role === "assistant" && (
                            <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                              <Brain className="h-3.5 w-3.5 text-white" />
                            </div>
                          )}
                          <div
                            className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                              msg.role === "user"
                                ? "rounded-br-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                                : "rounded-bl-sm bg-white/10 text-slate-200"
                            }`}
                          >
                            {displayContent}
                            {plan && plan.length > 0 && <ApplyPlanButton plan={plan} onRequestChange={(fb) => fillInput(fb)} />}
                          </div>
                        </div>
                      );
                    })}

                    {/* Streaming göstergesi */}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                          <Brain className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-white/10 px-4 py-3">
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          <span className="text-xs text-slate-400">Yazıyor...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  /* Hızlı Sorular */
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-slate-500">Hızlı sorular:</p>
                    {[
                      "Zayıf derslerim hangileri?",
                      "Bu hafta ne çalışmalıyım?",
                      "Haftalık program hazırla",
                    ].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => fillInput(q)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-slate-300 transition-colors hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-300"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="shrink-0 border-t border-white/10 px-4 py-3">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="mb-2 text-xs text-slate-500 transition-colors hover:text-slate-300"
                  >
                    Geçmişi temizle
                  </button>
                )}
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 transition-colors focus-within:border-purple-500/50"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Bir şey sor..."
                    disabled={isLoading}
                    className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="shrink-0 rounded-xl p-1.5 text-purple-400 transition-colors hover:bg-purple-500/20 disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
