"use client";

import { useState, useMemo } from "react";
import { mutate } from "swr";
import { Check, Square, BookOpen, BookMarked } from "lucide-react";
import { toggleTopicCompletion } from "@/lib/actions/topic-completions";
import { useCoachData } from "@/lib/swr/hooks";
import { updateCoachResources } from "@/lib/actions/profile";
import { SWR_KEYS } from "@/lib/swr/keys";

type Subject = { id: string; name: string };
type Completion = { subject_id: string; topic_name: string; exam_type: string };

interface KonuTakipClientProps {
  tytSubjects: string[];
  aytSubjects: string[];
  subjects: Subject[];
  completions: Completion[];
  tytTopics: Record<string, string[]>;
  aytTopics: Record<string, string[]>;
}

function isCompleted(
  completions: Completion[],
  subjectId: string,
  topicName: string,
  examType: string
): boolean {
  return completions.some(
    (c) =>
      c.subject_id === subjectId &&
      c.topic_name === topicName &&
      c.exam_type === examType
  );
}

export function KonuTakipClient({
  tytSubjects,
  aytSubjects,
  subjects,
  completions,
  tytTopics,
  aytTopics,
}: KonuTakipClientProps) {
  const [filter, setFilter] = useState<"tyt" | "ayt">("tyt");
  const [localCompletions, setLocalCompletions] = useState<Completion[]>(completions);
  const [loading, setLoading] = useState<string | null>(null);

  const subjectMap = new Map(subjects.map((s) => [s.name, s.id]));
  const topics = filter === "tyt" ? tytTopics : aytTopics;
  const subjectNames = filter === "tyt" ? tytSubjects : aytSubjects;

  let totalTopics = 0;
  let completedTopics = 0;
  for (const subj of subjectNames) {
    const list = topics[subj] ?? [];
    totalTopics += list.length;
    for (const t of list) {
      const sid = subjectMap.get(subj);
      if (sid && isCompleted(localCompletions, sid, t, filter)) completedTopics++;
    }
  }
  const yetismePct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  async function handleToggle(subjectId: string, topicName: string) {
    const key = `${subjectId}:${topicName}:${filter}`;
    setLoading(key);
    const err = await toggleTopicCompletion(subjectId, topicName, filter);
    setLoading(null);
    if (err?.error) return;
    const wasCompleted = isCompleted(localCompletions, subjectId, topicName, filter);
    setLocalCompletions((prev) => {
      if (wasCompleted) {
        return prev.filter(
          (c) =>
            !(c.subject_id === subjectId && c.topic_name === topicName && c.exam_type === filter)
        );
      }
      return [...prev, { subject_id: subjectId, topic_name: topicName, exam_type: filter }];
    });
    mutate(SWR_KEYS.gorevEkle);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Konularım / Kaynaklarım
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Konu ilerlemenizi takip edin ve AI Koç için kullanacağınız kaynakları seçin.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["tyt", "ayt"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === t
                ? "bg-indigo-500 text-white"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Yetişme Oranı
          </p>
          <p className="text-2xl font-bold text-indigo-500">
            %{yetismePct}
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${yetismePct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {completedTopics} / {totalTopics} konu tamamlandı
        </p>
      </div>

      <div className="space-y-6">
        {subjectNames.map((subjName) => {
          const list = topics[subjName] ?? [];
          const sid = subjectMap.get(subjName);
          if (!sid || list.length === 0) return null;
          const done = list.filter((t) =>
            isCompleted(localCompletions, sid, t, filter)
          ).length;
          return (
            <div
              key={subjName}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <BookOpen className="h-4 w-4" />
                  {subjName}
                </h3>
                <span className="text-xs text-slate-500">
                  {done}/{list.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {list.map((topic) => {
                  const completed = isCompleted(localCompletions, sid, topic, filter);
                  const key = `${sid}:${topic}:${filter}`;
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleToggle(sid, topic)}
                      disabled={loading === key}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-all ${
                        completed
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                    >
                      {completed ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400" />
                      )}
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Kaynaklarım - AI Koç için kullanılacak kaynaklar */}
      <KaynaklarimSection />
    </div>
  );
}

type CoachResourceItem = { t: "r" | "u"; id: string; name: string };

function KaynaklarimSection() {
  const { data: coachData, mutate: mutateCoach } = useCoachData();
  const [savingResources, setSavingResources] = useState(false);
  const dersResources = coachData?.dersResources ?? [];
  const denemeResources = coachData?.denemeResources ?? [];
  const userResources = coachData?.userResources ?? [];
  const coachResourceIds = coachData?.coachResourceIds ?? [];

  const allResources: CoachResourceItem[] = useMemo(() => {
    const ders = dersResources.map((r: { id: string; name: string }) => ({ t: "r" as const, id: r.id, name: r.name ?? "" }));
    const deneme = denemeResources.map((r: { id: string; name: string }) => ({ t: "r" as const, id: r.id, name: r.name ?? "" }));
    const user = userResources.map((r: { id: string; name: string }) => ({ t: "u" as const, id: r.id, name: r.name ?? "" }));
    return [...ders, ...deneme, ...user];
  }, [dersResources, denemeResources, userResources]);

  const selectedSet = useMemo(() => {
    const s = new Set<string>();
    for (const c of coachResourceIds) {
      if (c?.t && c?.id) s.add(`${c.t}:${c.id}`);
    }
    return s;
  }, [coachResourceIds]);

  async function toggleResource(item: CoachResourceItem) {
    const key = `${item.t}:${item.id}`;
    const next: { t: "r" | "u"; id: string }[] = selectedSet.has(key)
      ? (coachResourceIds as { t: "r" | "u"; id: string }[]).filter((c) => !(c.t === item.t && c.id === item.id))
      : [...(coachResourceIds as { t: "r" | "u"; id: string }[]), { t: item.t, id: item.id }];
    setSavingResources(true);
    const res = await updateCoachResources(next);
    setSavingResources(false);
    if (!res.error) mutateCoach();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2">
        <BookMarked className="h-5 w-5 text-indigo-500" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Kaynaklarım</h2>
        {allResources.length > 0 && (
          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
            {selectedSet.size} seçili
          </span>
        )}
      </div>
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        AI Koç program hazırlarken kullanacağınız kitapları ve denemeleri seçin.
      </p>
      {allResources.length === 0 ? (
        <p className="text-sm text-slate-500">Henüz kaynak yok. Görev Ekle sayfasından görev ekleyerek kaynakları oluşturabilirsiniz.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allResources.map((item) => {
            const key = `${item.t}:${item.id}`;
            const checked = selectedSet.has(key);
            return (
              <label
                key={key}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                  checked
                    ? "border-indigo-500/50 bg-indigo-50 dark:border-indigo-500/50 dark:bg-indigo-900/20"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600"
                } ${savingResources ? "opacity-70" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleResource(item)}
                  disabled={savingResources}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600"
                />
                <span className={`font-medium ${checked ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"}`}>
                  {item.name || "(İsimsiz)"}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
