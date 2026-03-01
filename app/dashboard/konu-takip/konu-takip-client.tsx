"use client";

import { useState } from "react";
import { mutate } from "swr";
import { Check, Square, BookOpen } from "lucide-react";
import { toggleTopicCompletion } from "@/lib/actions/topic-completions";
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
          Konu Takip
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          TYT ve AYT müfredatındaki konuları işaretleyerek ilerlemenizi takip edin.
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
    </div>
  );
}
