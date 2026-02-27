"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  addTask,
  addUserResource,
  deleteUserResource,
} from "@/lib/actions/plans";
import { useGorevEkleData, revalidateKey } from "@/lib/swr/hooks";
import { Button } from "@/components/ui/button";
import { Video, FileQuestion, ClipboardList, Search, Plus, Clock, ChevronDown, Trash2 } from "lucide-react";

type TaskType = "video" | "test" | "deneme";

const DAY_NAMES = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getWeekDates() {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  const dates: { date: string; label: string; dayOfWeek: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push({
      date: toLocalDateStr(d),
      label: DAY_NAMES[i],
      dayOfWeek: i + 1,
    });
  }
  return dates;
}

interface Resource {
  id: string;
  name: string;
  icon_url?: string | null;
  publisher_id?: string | null;
}

interface Subject {
  id: string;
  name: string;
  icon_url?: string | null;
}

interface Publisher {
  id: string;
  name: string;
  sort_order?: number;
  logo_url?: string | null;
}

function SubjectSelect({
  subjects,
  selectedId,
  onSelect,
}: {
  subjects: Subject[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return subjects.filter((s) => s.name.toLowerCase().includes(q));
  }, [subjects, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = subjects.find((s) => s.id === selectedId);
  const displayValue = selected?.name ?? (isOpen ? "" : "Ders seçin");

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">
        Ders
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-10 text-left text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.icon_url ? (
            <img
              src={selected.icon_url}
              alt=""
              className="h-6 w-6 shrink-0 rounded object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-xs text-slate-400 dark:bg-slate-700">—</span>
          )}
          <span className={selected ? "font-medium" : "text-slate-500 truncate"}>{displayValue}</span>
        </span>
        <ChevronDown
          className={`absolute right-3 h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="animate-dropdown-in absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-2 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ders ara..."
                className="w-full rounded border border-slate-200 py-1.5 pl-8 pr-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-slate-500">
                {search ? "Sonuç bulunamadı" : "Ders yok"}
              </p>
            ) : (
              filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onSelect(s.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    selectedId === s.id
                      ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {s.icon_url ? (
                    <img
                      src={s.icon_url}
                      alt=""
                      className="h-6 w-6 shrink-0 rounded object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-xs text-slate-400 dark:bg-slate-700">—</span>
                  )}
                  {s.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PublisherSelect({
  publishers,
  selectedId,
  onSelect,
  placeholder = "Seçin",
}: {
  publishers: Publisher[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return publishers.filter((p) => p.name.toLowerCase().includes(q));
  }, [publishers, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = publishers.find((p) => p.id === selectedId);
  const displayValue = selected?.name ?? (isOpen ? "" : placeholder);

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">
        Yayın evi
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-10 text-left text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.logo_url && (
            <img
              src={selected.logo_url}
              alt=""
              className="h-6 w-6 shrink-0 rounded object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <span className={selected ? "font-medium" : "text-slate-500 truncate"}>{displayValue}</span>
        </span>
        <ChevronDown
          className={`absolute right-3 h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="animate-dropdown-in absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-2 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Yayın evi ara..."
                className="w-full rounded border border-slate-200 py-1.5 pl-8 pr-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-slate-500">
                {search ? "Sonuç bulunamadı" : "Yayın evi yok"}
              </p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelect(p.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    selectedId === p.id
                      ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {p.logo_url ? (
                    <img
                      src={p.logo_url}
                      alt=""
                      className="h-6 w-6 shrink-0 rounded object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-xs text-slate-400 dark:bg-slate-700">—</span>
                  )}
                  {p.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ResourceSelect({
  resources,
  userResources,
  selectedId,
  selectedName,
  selectedIconUrl,
  onSelect,
  onDeleteUserResource,
  onUserResourcesChange,
  placeholder = "Kaynak seçin",
}: {
  resources: Resource[];
  userResources: Resource[];
  selectedId: string;
  selectedName: string;
  selectedIconUrl?: string | null;
  onSelect: (id: string, isUser: boolean) => void;
  onDeleteUserResource: (id: string) => Promise<void>;
  onUserResourcesChange: (fn: (prev: Resource[]) => Resource[]) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredResources = useMemo(() => {
    const q = search.toLowerCase();
    return resources.filter((r) => r.name.toLowerCase().includes(q));
  }, [resources, search]);

  const filteredUserResources = useMemo(() => {
    const q = search.toLowerCase();
    return userResources.filter((r) => r.name.toLowerCase().includes(q));
  }, [userResources, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(id: string, isUser: boolean) {
    onSelect(id, isUser);
    setIsOpen(false);
    setSearch("");
  }

  const displayValue = selectedName || (isOpen ? "" : placeholder);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-10 text-left text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selectedIconUrl ? (
            <img
              src={selectedIconUrl}
              alt=""
              className="h-6 w-6 shrink-0 rounded object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : selectedName ? (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-xs text-slate-400 dark:bg-slate-700">—</span>
          ) : null}
          <span className={selectedName ? "font-medium truncate" : "text-slate-500"}>
            {displayValue}
          </span>
        </span>
        <ChevronDown
          className={`absolute right-3 h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="animate-dropdown-in absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-2 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Kaynak ara..."
                className="w-full rounded border border-slate-200 py-1.5 pl-8 pr-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredResources.length === 0 && filteredUserResources.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-slate-500">
                {search ? "Sonuç bulunamadı" : "Kaynak yok"}
              </p>
            )}
            {filteredResources.length > 0 && (
              <>
                <div className="border-b border-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-700">
                  Hazır Kaynaklar
                </div>
                {filteredResources.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelect(r.id, false)}
                    className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      selectedId === r.id
                        ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {r.icon_url ? (
                      <img
                        src={r.icon_url}
                        alt=""
                        className="h-6 w-6 shrink-0 rounded object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-xs text-slate-400 dark:bg-slate-700">—</span>
                    )}
                    {r.name}
                  </button>
                ))}
              </>
            )}
            {filteredUserResources.length > 0 && (
              <>
                <div className="border-t border-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-700">
                  Kendi Kaynaklarım
                </div>
                {filteredUserResources.map((r) => (
                  <div
                    key={r.id}
                    className={`flex items-center justify-between gap-1 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      selectedId === r.id ? "bg-blue-50 dark:bg-blue-900/30" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelect(r.id, true)}
                      className={`flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left text-sm ${
                        selectedId === r.id ? "font-medium text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {r.icon_url ? (
                        <img
                          src={r.icon_url}
                          alt=""
                          className="h-6 w-6 shrink-0 rounded object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-xs text-slate-400 dark:bg-slate-700">—</span>
                      )}
                      {r.name}
                    </button>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await onDeleteUserResource(r.id);
                        onUserResourcesChange((prev) => prev.filter((ur) => ur.id !== r.id));
                        if (selectedId === r.id) onSelect("", false);
                      }}
                      className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      title="Kaynağı sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GorevEklePage() {
  const router = useRouter();
  const { data, isLoading } = useGorevEkleData();
  const subjects = data?.subjects ?? [];
  const publishers = data?.publishers ?? [];
  const dersResources = data?.dersResources ?? [];
  const denemeResources = data?.denemeResources ?? [];
  const [userResources, setUserResources] = useState<Resource[]>(data?.userResources ?? []);

  const [taskType, setTaskType] = useState<TaskType>("test");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [selectedPublisherId, setSelectedPublisherId] = useState("");
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [selectedUserResourceId, setSelectedUserResourceId] = useState("");
  const [questionCount, setQuestionCount] = useState("");
  const [targetDuration, setTargetDuration] = useState("");
  const [videoTaskName, setVideoTaskName] = useState("");
  const [customResourceInput, setCustomResourceInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const weekDates = getWeekDates();
  const defaultDate = weekDates[0]?.date ?? "";

  useEffect(() => {
    if (selectedDates.length === 0 && defaultDate) setSelectedDates([defaultDate]);
  }, [defaultDate]);

  useEffect(() => {
    if (data?.userResources) setUserResources(data.userResources);
  }, [data?.userResources]);

  useEffect(() => {
    if (!subjectId && subjects[0]) setSubjectId(subjects[0].id);
  }, [subjects, subjectId]);

  function handleResourceSelect(id: string, isUser: boolean) {
    if (isUser) {
      setSelectedUserResourceId(id);
      setSelectedResourceId("");
    } else {
      setSelectedResourceId(id);
      setSelectedUserResourceId("");
    }
  }

  async function handleAddCustomResource() {
    if (!customResourceInput.trim()) return;
    const res = await addUserResource(customResourceInput.trim());
    if (res.id) {
      const newResource = { id: res.id, name: customResourceInput.trim() };
      setUserResources((prev) => [...prev, newResource]);
      setSelectedUserResourceId(res.id);
      setSelectedResourceId("");
      setCustomResourceInput("");
      setShowCustomInput(false);
      revalidateKey("gorevEkle");
    } else if (res.error) {
      setError(res.error);
    }
  }

  function toggleDate(date: string) {
    setSelectedDates((prev) => {
      if (prev.includes(date)) {
        if (prev.length <= 1) return prev;
        return prev.filter((d) => d !== date);
      }
      return [...prev, date];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const datesToAdd = selectedDates.length > 0 ? selectedDates : [defaultDate];

    if (taskType !== "video" && !selectedResourceId && !selectedUserResourceId) {
      setError("Lütfen bir kaynak seçin veya kendi kaynağınızı ekleyin.");
      setLoading(false);
      return;
    }

    for (const selectedDate of datesToAdd) {
      const dayOfWeek = weekDates.find((d) => d.date === selectedDate)?.dayOfWeek ?? 1;
      const result = await addTask({
        task_date: selectedDate,
        day_of_week: dayOfWeek,
        subject_id: taskType !== "deneme" ? subjectId : undefined,
        task_type: taskType,
        resource_id: selectedResourceId || undefined,
        user_resource_id: selectedUserResourceId || undefined,
        question_count: taskType !== "video" ? parseInt(questionCount) || 0 : 0,
        target_duration: parseInt(targetDuration) || 0,
        resource_name: taskType === "video" ? videoTaskName || undefined : undefined,
      });

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    setSuccess(true);
    revalidateKey("weeklyPlan");
    revalidateKey("stats");
    setTimeout(() => {
      router.push("/dashboard");
    }, 800);
  }

  const allResourcesByType = taskType === "deneme" ? denemeResources : dersResources;
  const currentResources = selectedPublisherId
    ? allResourcesByType.filter((r) => r.publisher_id === selectedPublisherId)
    : [];

  if (success) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Görev Eklendi</h1>
        <div className="animate-banner-in rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
          <p className="text-green-800 dark:text-green-200">
            Görev başarıyla eklendi. Dashboard&apos;a yönlendiriliyorsunuz...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Görev Ekle</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Video, test veya deneme sınavı görevi ekleyin.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        {error && (
          <div className="animate-banner-in rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Görev tipi */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Görev Tipi
          </label>
          <div className="flex gap-2">
            {[
              { type: "test" as const, label: "Test", icon: FileQuestion },
              { type: "deneme" as const, label: "Deneme", icon: ClipboardList },
              { type: "video" as const, label: "Video", icon: Video },
            ].map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setTaskType(type);
                  setSelectedPublisherId("");
                  setSelectedResourceId("");
                  setSelectedUserResourceId("");
                }}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  taskType === type
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Gün seçimi - birden fazla seçilebilir */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Hangi güne eklenecek? (Birden fazla seçebilirsiniz)
          </label>
          <div className="flex flex-wrap gap-2">
            {weekDates.map((d) => (
              <button
                key={d.date}
                type="button"
                onClick={() => toggleDate(d.date)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedDates.includes(d.date)
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ders - sadece test ve video için */}
        {taskType !== "deneme" && (
          <SubjectSelect
            subjects={subjects}
            selectedId={subjectId}
            onSelect={setSubjectId}
          />
        )}

        {/* Deneme etiketi */}
        {taskType === "deneme" && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20">
            <ClipboardList className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Deneme Sınavı</span>
          </div>
        )}

        {/* Kaynak seçimi - video hariç: önce yayın evi, sonra kaynak */}
        {taskType !== "video" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {taskType === "deneme" ? "Deneme kaynağı" : "Kaynak"}
              </span>
              <button
                type="button"
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <Plus className="h-3 w-3" />
                Aradığımı bulamıyorum
              </button>
            </div>

            {showCustomInput && (
              <div className="animate-panel-in flex gap-2">
                <input
                  type="text"
                  value={customResourceInput}
                  onChange={(e) => setCustomResourceInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomResource())}
                  placeholder="Kaynak adı yazın"
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCustomResource}
                  disabled={!customResourceInput.trim()}
                >
                  Ekle
                </Button>
              </div>
            )}

            <PublisherSelect
              publishers={publishers}
              selectedId={selectedPublisherId}
              onSelect={(id) => {
                setSelectedPublisherId(id);
                setSelectedResourceId("");
              }}
              placeholder="Yayın evi seçin"
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">
                {taskType === "deneme" ? "Deneme" : "Kitap / kaynak"}
              </label>
              {selectedPublisherId ? (
                <ResourceSelect
                  resources={currentResources}
                  userResources={userResources}
                  selectedId={selectedResourceId || selectedUserResourceId}
                  selectedName={
                    selectedResourceId
                      ? currentResources.find((r) => r.id === selectedResourceId)?.name ?? ""
                      : selectedUserResourceId
                        ? userResources.find((r) => r.id === selectedUserResourceId)?.name ?? ""
                        : ""
                  }
                  selectedIconUrl={
                    selectedResourceId
                      ? currentResources.find((r) => r.id === selectedResourceId)?.icon_url
                      : selectedUserResourceId
                        ? userResources.find((r) => r.id === selectedUserResourceId)?.icon_url
                        : null
                  }
                  onSelect={handleResourceSelect}
                  onDeleteUserResource={async (id) => {
                    const res = await deleteUserResource(id);
                    if (res.error) setError(res.error);
                  }}
                  onUserResourcesChange={setUserResources}
                  placeholder="Kaynak seçin"
                />
              ) : (
                <div className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-slate-50 py-2 pl-3 pr-10 text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
                  Önce yayın evi seçin
                </div>
              )}
            </div>
          </div>
        )}

        {/* Soru sayısı ve hedeflenen süre - test/deneme */}
        {(taskType === "test" || taskType === "deneme") && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Soru Sayısı
              </label>
              <input
                type="number"
                min={1}
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                placeholder="Örn: 40"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Clock className="h-3.5 w-3.5" />
                Hedeflenen Süre (dk)
              </label>
              <input
                type="number"
                min={1}
                value={targetDuration}
                onChange={(e) => setTargetDuration(e.target.value)}
                placeholder="Örn: 60"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Video - İsim */}
        {taskType === "video" && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Görev adı
            </label>
            <input
              type="text"
              value={videoTaskName}
              onChange={(e) => setVideoTaskName(e.target.value)}
              placeholder="Örn: Matematik - Türev konusu"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Ekleniyor..." : "Görev Ekle"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard">İptal</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
