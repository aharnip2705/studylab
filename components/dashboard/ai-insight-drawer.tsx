"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Brain, Sparkles, Send, Loader2, BookmarkCheck } from "lucide-react";
import type { PracticeExam } from "@/lib/actions/practice-exams";
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

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  plan?: AiPlanDay[];
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
        m !== null && typeof m === "object" && "role" in (m as object) && "content" in (m as object)
    ) as ChatMessage[];
  } catch {
    return [];
  }
}

function saveMessages(msgs: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AI_CHAT_STORAGE_KEY, JSON.stringify(msgs));
  } catch { /* ignore */ }
}

function ApplyPlanButton({ plan }: { plan: AiPlanDay[] }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [confirming, setConfirming] = useState(false);

  async function handleApply() {
    setStatus("loading");
    setConfirming(false);
    try {
      const result = await applyAiPlan(plan);
      if ("error" in result) { setStatus("error"); }
      else { setStatus("done"); revalidateKey("weeklyPlan"); }
    } catch { setStatus("error"); }
  }

  if (status === "done") {
    return <p className="mt-2 text-xs font-medium text-emerald-400">Program haftalık plana eklendi!</p>;
  }
  return (
    <div className="mt-2 flex flex-col gap-2">
      {confirming ? (
        <>
          <p className="text-xs text-amber-400">⚠ Mevcut görevler silinecektir. Onaylıyor musunuz?</p>
          <div className="flex gap-2">
            <button type="button" onClick={handleApply} disabled={status === "loading"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50">
              {status === "loading" ? "Ekleniyor..." : "Evet, Uygula"}
            </button>
            <button type="button" onClick={() => setConfirming(false)}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-300">
              İptal
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-amber-400">⚠ Mevcut görevler silinecektir.</p>
          <button type="button" onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30">
            <BookmarkCheck className="h-3.5 w-3.5" />
            Haftalık Plana Ekle
          </button>
        </>
      )}
      {status === "error" && (
        <button type="button" onClick={handleApply} className="text-xs text-rose-400 hover:underline">
          Hata – Tekrar Dene
        </button>
      )}
    </div>
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
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadStoredMessages());
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const insightFetchedRef = useRef(false);

  useEffect(() => { saveMessages(messages); }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [messages]);

  const fetchInsight = useCallback(async () => {
    if (!isPro || exams.length === 0 || insightFetchedRef.current) return;
    insightFetchedRef.current = true;
    setInsightLoading(true);
    try {
      const res = await fetch("/api/ai-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          exams: exams.slice(0, 5).map((e) => ({
            name: e.exam_name, type: e.exam_type,
            correct: e.total_correct, wrong: e.total_wrong,
            time: e.total_time_minutes, subject_details: e.subject_details,
          })),
          studyField,
        }),
      });
      const data = (await res.json()) as { insight?: string | null; error?: string };
      if (res.ok) setInsight(data.insight ?? null);
    } catch { /* ignore */ }
    finally { setInsightLoading(false); }
  }, [exams, isPro, studyField]);

  useEffect(() => {
    if (isOpen && !insightFetchedRef.current) fetchInsight();
  }, [isOpen, fetchInsight]);

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
            name: e.exam_name, type: e.exam_type,
            correct: e.total_correct, wrong: e.total_wrong,
            time: e.total_time_minutes, subject_details: e.subject_details,
          })),
          studyField,
          tytTargetNet,
          aytTargetNet,
        }),
      });
      const data = (await res.json()) as { reply?: string | null; error?: string; plan?: AiPlanDay[] };
      const reply = data.reply ?? data.error ?? "Üzgünüm, yanıt oluşturamadım.";
      setMessages((m) => [...m, { role: "assistant" as const, content: reply, plan: data.plan }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Bağlantı hatası.";
      setMessages((m) => [...m, { role: "assistant" as const, content: msg }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, messages, exams, studyField, tytTargetNet, aytTargetNet]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  if (!isPro) return null;

  // Latest net data for status cards
  const latestExam = exams[0] ?? null;
  const latestTytExam = exams.find((e) => e.exam_type === "tyt") ?? null;
  const latestAytExam = exams.find((e) => e.exam_type === "ayt") ?? null;

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
        style={{
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
        }}
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
              style={{ background: "rgba(30, 31, 41, 0.95)", backdropFilter: "blur(20px)" }}
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)" }}>
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white">StudyLab Insight</h2>
                    <p className="text-xs text-slate-400">AI Koçunuz</p>
                  </div>
                </div>
                <button type="button" onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white">
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
                              <span>Hedef: {tytTargetNet}</span>
                              <span>{Math.min(100, Math.round(((latestTytExam.total_correct - latestTytExam.total_wrong * 0.25) / tytTargetNet) * 100))}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-white/10">
                              <div className="h-1.5 rounded-full bg-indigo-500 transition-all"
                                style={{ width: `${Math.min(100, ((latestTytExam.total_correct - latestTytExam.total_wrong * 0.25) / tytTargetNet) * 100)}%` }} />
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
                              <span>Hedef: {aytTargetNet}</span>
                              <span>{Math.min(100, Math.round(((latestAytExam.total_correct - latestAytExam.total_wrong * 0.25) / aytTargetNet) * 100))}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-white/10">
                              <div className="h-1.5 rounded-full bg-purple-500 transition-all"
                                style={{ width: `${Math.min(100, ((latestAytExam.total_correct - latestAytExam.total_wrong * 0.25) / aytTargetNet) * 100)}%` }} />
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
                    <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">AI Tavsiye</span>
                  </div>
                  {insightLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400 [animation-delay:150ms]" />
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400 [animation-delay:300ms]" />
                      <span className="text-xs text-slate-500">Analiz ediliyor...</span>
                    </div>
                  ) : insight ? (
                    <p className="text-sm leading-relaxed text-slate-300">{insight}</p>
                  ) : exams.length === 0 ? (
                    <p className="text-sm text-slate-500">Deneme sonucu ekleyince analiz başlar.</p>
                  ) : (
                    <p className="text-sm text-slate-500">Analiz yüklenemedi.</p>
                  )}
                </div>

                {/* Chat Messages */}
                {messages.length > 0 && (
                  <div className="space-y-3">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                          msg.role === "user"
                            ? "rounded-br-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                            : "rounded-bl-sm bg-white/10 text-slate-200"
                        }`}>
                          {msg.content}
                          {msg.plan && msg.plan.length > 0 && (
                            <ApplyPlanButton plan={msg.plan} />
                          )}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-white/10 px-4 py-3">
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          <span className="text-xs text-slate-400">Yanıt yazılıyor...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {messages.length === 0 && !chatLoading && (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-slate-500">Hızlı sorular:</p>
                    {["Zayıf derslerim hangileri?", "Bu hafta ne çalışmalıyım?", "Haftalık program hazırla"].map((q) => (
                      <button key={q} type="button" onClick={() => { setChatInput(q); setTimeout(() => inputRef.current?.focus(), 100); }}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-slate-300 transition-colors hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-300">
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="shrink-0 border-t border-white/10 px-4 py-3">
                {messages.length > 0 && (
                  <button type="button" onClick={() => setMessages([])}
                    className="mb-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    Geçmişi temizle
                  </button>
                )}
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 transition-colors focus-within:border-purple-500/50">
                  <input
                    ref={inputRef}
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChatMessage()}
                    placeholder="Bir şey sor..."
                    disabled={chatLoading}
                    className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                  <button type="button" onClick={sendChatMessage}
                    disabled={!chatInput.trim() || chatLoading}
                    className="shrink-0 rounded-xl p-1.5 text-purple-400 transition-colors hover:bg-purple-500/20 disabled:opacity-40">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
