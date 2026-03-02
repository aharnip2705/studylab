"use client";

import { useState } from "react";
import { mutate } from "swr";
import { Check, Square, BookOpen, Plus, Trash2 } from "lucide-react";
import { toggleTopicCompletion } from "@/lib/actions/topic-completions";
import { addUserResource, deleteUserResource, getUserResources } from "@/lib/actions/plans";
import { SWR_KEYS } from "@/lib/swr/keys";

type Subject = { id: string; name: string };
type Completion = { subject_id: string; topic_name: string; exam_type: string };
type UserResource = { id: string; name: string; icon_url?: string | null };

interface KonuTakipClientProps {
  tytSubjects: string[];
  aytSubjects: string[];
  subjects: Subject[];
  completions: Completion[];
  tytTopics: Record<string, string[]>;
  aytTopics: Record<string, string[]>;
  initialUserResources: UserResource[];
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
  initialUserResources,
}: KonuTakipClientProps) {
  const [activeTab, setActiveTab] = useState<"konularim" | "kaynaklarim">("konularim");
  const [examFilter, setExamFilter] = useState<"tyt" | "ayt">("tyt");
  const [localCompletions, setLocalCompletions] = useState<Completion[]>(completions);
  const [loading, setLoading] = useState<string | null>(null);

  const subjectMap = new Map(subjects.map((s) => [s.name, s.id]));
  const topics = examFilter === "tyt" ? tytTopics : aytTopics;
  const subjectNames = examFilter === "tyt" ? tytSubjects : aytSubjects;

  let totalTopics = 0;
  let completedTopics = 0;
  for (const subj of subjectNames) {
    const list = topics[subj] ?? [];
    totalTopics += list.length;
    for (const t of list) {
      const sid = subjectMap.get(subj);
      if (sid && isCompleted(localCompletions, sid, t, examFilter)) completedTopics++;
    }
  }
  const yetismePct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  async function handleToggle(subjectId: string, topicName: string) {
    const key = `${subjectId}:${topicName}:${examFilter}`;
    setLoading(key);
    const err = await toggleTopicCompletion(subjectId, topicName, examFilter);
    setLoading(null);
    if (err?.error) return;
    const wasCompleted = isCompleted(localCompletions, subjectId, topicName, examFilter);
    setLocalCompletions((prev) => {
      if (wasCompleted) {
        return prev.filter(
          (c) =>
            !(c.subject_id === subjectId && c.topic_name === topicName && c.exam_type === examFilter)
        );
      }
      return [...prev, { subject_id: subjectId, topic_name: topicName, exam_type: examFilter }];
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
          Konu ilerlemenizi takip edin ve çalışmalarınızda kullandığınız kaynakları yönetin.
        </p>
      </div>

      {/* Ana sekme: Konularım / Kaynaklarım */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/40">
        {([
          { key: "konularim" as const, label: "Konularım" },
          { key: "kaynaklarim" as const, label: "Kaynaklarım" },
        ]).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              activeTab === key
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700/80 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "konularim" ? (
        <>
          {/* TYT / AYT filtre */}
          <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800/30 w-fit">
            {(["tyt", "ayt"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setExamFilter(t)}
                className={`rounded-md px-5 py-1.5 text-sm font-medium transition-all ${
                  examFilter === t
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
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
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {completedTopics} / {totalTopics} konu tamamlandı
            </p>
          </div>

          <div className="space-y-6">
            {subjectNames.map((subjName) => {
              const list = topics[subjName] ?? [];
              const sid = subjectMap.get(subjName);
              if (!sid || list.length === 0) return null;
              const done = list.filter((t) =>
                isCompleted(localCompletions, sid, t, examFilter)
              ).length;
              return (
                <div
                  key={subjName}
                  className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                      <BookOpen className="h-4 w-4 text-indigo-500" />
                      {subjName}
                    </h3>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {done}/{list.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {list.map((topic) => {
                      const completed = isCompleted(localCompletions, sid, topic, examFilter);
                      const key = `${sid}:${topic}:${examFilter}`;
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
        </>
      ) : (
        <KaynaklarimTab initialUserResources={initialUserResources} />
      )}
    </div>
  );
}

function KaynaklarimTab({ initialUserResources }: { initialUserResources: UserResource[] }) {
  const [userResources, setUserResources] = useState<UserResource[]>(initialUserResources);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    setError(null);
    const res = await addUserResource(newName.trim());
    setAdding(false);
    if (res.id) {
      setUserResources((prev) => [...prev, { id: res.id!, name: newName.trim() }]);
      setNewName("");
      mutate(SWR_KEYS.gorevEkle);
      mutate(SWR_KEYS.coachData);
    } else if (res.error) {
      setError(res.error);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteUserResource(id);
    setDeletingId(null);
    setUserResources((prev) => prev.filter((r) => r.id !== id));
    mutate(SWR_KEYS.gorevEkle);
    mutate(SWR_KEYS.coachData);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">Yeni Kaynak Ekle</h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          Kitap, soru kitabı veya deneme adını girin. AI Koç programı hazırlarken bu kaynakları kullanacak.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="örn: Birey TYT Matematik, Karaağaç AYT..."
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {adding ? "Ekleniyor..." : "Ekle"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>

      {userResources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Henüz kaynak eklenmemiş</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            Yukarıdan ilk kaynağınızı ekleyin
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {userResources.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="text-sm font-medium text-slate-900 dark:text-white">{r.name}</span>
              <button
                type="button"
                onClick={() => handleDelete(r.id)}
                disabled={deletingId === r.id}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
