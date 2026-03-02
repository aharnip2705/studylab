"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { mutate } from "swr";
import { Check, Square, BookOpen, Plus, Trash2, Search, ChevronDown, Brain } from "lucide-react";
import { toggleTopicCompletion } from "@/lib/actions/topic-completions";
import { addUserResource, deleteUserResource } from "@/lib/actions/plans";
import { updateCoachResources } from "@/lib/actions/profile";
import { useCoachData } from "@/lib/swr/hooks";
import { SWR_KEYS } from "@/lib/swr/keys";

type Subject = { id: string; name: string; icon_url?: string | null };
type Completion = { subject_id: string; topic_name: string; exam_type: string };
type UserResource = { id: string; name: string; icon_url?: string | null };
type Resource = { id: string; name: string; icon_url?: string | null; publisher_id?: string | null; subject_id?: string | null };
type Publisher = { id: string; name: string; logo_url?: string | null };

// Görev Ekle ile aynı ders eşleştirmesi
const SUBJECT_FILTER_KEYWORDS: Record<string, string[]> = {
  "matematik": ["matematik", "geometri", "türev", "integral", "problem", "polinom", "fonksiyon", "üçgen", "analitik"],
  "geometri": ["geometri", "üçgen", "açı", "alan", "çevre", "analitik geometri"],
  "fizik": ["fizik", "kuvvet", "hareket", "elektrik", "optik", "dalga", "enerji"],
  "kimya": ["kimya", "asit", "baz", "tuz", "organik", "mol", "element", "bileşik"],
  "biyoloji": ["biyoloji", "hücre", "genetik", "ekosistem", "canlı"],
  "türkçe": ["türkçe", "türk dili", "fiilimsi", "paragraf", "sözcük", "anlam", "dil bilgisi"],
  "tarih": ["tarih", "osmanlı", "cumhuriyet", "inkılap"],
  "coğrafya": ["coğrafya", "iklim", "nüfus", "harita"],
  "felsefe": ["felsefe", "mantık", "psikoloji", "sosyoloji"],
  "edebiyat": ["edebiyat", "şiir", "roman", "hikaye", "divan"],
};

function resourceMatchesSubject(resourceName: string, subjectName: string): boolean {
  const name = resourceName.toLowerCase();
  const subj = subjectName.toLowerCase();
  if (name.includes(subj)) return true;
  const keywords = SUBJECT_FILTER_KEYWORDS[subj];
  if (keywords) return keywords.some((kw) => name.includes(kw));
  return false;
}

interface KonuTakipClientProps {
  tytSubjects: string[];
  aytSubjects: string[];
  subjects: Subject[];
  completions: Completion[];
  tytTopics: Record<string, string[]>;
  aytTopics: Record<string, string[]>;
  initialUserResources: UserResource[];
  publishers: Publisher[];
  dersResources: Resource[];
  denemeResources: Resource[];
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

/* ─── Ders dropdown ─── */
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return subjects.filter((s) => s.name.toLowerCase().includes(q));
  }, [subjects, search]);

  const selected = subjects.find((s) => s.id === selectedId);
  const displayValue = selected?.name ?? (isOpen ? "" : "Ders seçin");

  return (
    <div ref={ref} className="relative">
      <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">Ders</label>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-10 text-left text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.icon_url ? (
            <img src={selected.icon_url} alt="" className="h-6 w-6 shrink-0 rounded object-contain" referrerPolicy="no-referrer"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-xs text-slate-400 dark:bg-slate-700">—</span>
          )}
          <span className={selected ? "font-medium truncate" : "text-slate-500"}>{displayValue}</span>
        </span>
        <ChevronDown className={`absolute right-3 h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="animate-dropdown-in absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-2 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Ders ara..." className="w-full rounded border border-slate-200 py-1.5 pl-8 pr-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-slate-500">{search ? "Sonuç bulunamadı" : "Ders yok"}</p>
            ) : filtered.map((s) => (
              <button key={s.id} type="button"
                onClick={() => { onSelect(s.id); setIsOpen(false); setSearch(""); }}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
                  selectedId === s.id ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {s.icon_url ? (
                  <img src={s.icon_url} alt="" className="h-6 w-6 shrink-0 rounded object-contain" referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-xs text-slate-400 dark:bg-slate-700">—</span>
                )}
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Publisher dropdown ─── */
function PublisherSelect({
  publishers,
  selectedId,
  onSelect,
}: {
  publishers: Publisher[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return publishers.filter((p) => p.name.toLowerCase().includes(q));
  }, [publishers, search]);

  const selected = publishers.find((p) => p.id === selectedId);

  return (
    <div ref={ref} className="relative">
      <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">Yayın evi</label>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-10 text-left text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.logo_url && (
            <img src={selected.logo_url} alt="" className="h-6 w-6 shrink-0 rounded object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          )}
          <span className={selected ? "font-medium truncate" : "text-slate-500"}>
            {selected?.name ?? "Yayın evi seçin"}
          </span>
        </span>
        <ChevronDown className={`absolute right-3 h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="animate-dropdown-in absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-2 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Yayın evi ara..."
                className="w-full rounded border border-slate-200 py-1.5 pl-8 pr-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-slate-500">{search ? "Sonuç bulunamadı" : "Yayın evi yok"}</p>
            ) : filtered.map((p) => (
              <button key={p.id} type="button"
                onClick={() => { onSelect(p.id); setIsOpen(false); setSearch(""); }}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
                  selectedId === p.id ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {p.logo_url && <img src={p.logo_url} alt="" className="h-6 w-6 shrink-0 rounded object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Resource dropdown ─── */
function ResourceSelect({
  resources,
  userResources,
  selectedId,
  onSelect,
  onDeleteUser,
  onUserChange,
}: {
  resources: Resource[];
  userResources: UserResource[];
  selectedId: string;
  onSelect: (id: string, isUser: boolean) => void;
  onDeleteUser: (id: string) => Promise<void>;
  onUserChange: (fn: (prev: UserResource[]) => UserResource[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const filteredRes = useMemo(() => {
    const q = search.toLowerCase();
    return resources.filter((r) => r.name.toLowerCase().includes(q));
  }, [resources, search]);

  const filteredUser = useMemo(() => {
    const q = search.toLowerCase();
    return userResources.filter((r) => r.name.toLowerCase().includes(q));
  }, [userResources, search]);

  const selectedRes = resources.find((r) => r.id === selectedId);
  const selectedUser = userResources.find((r) => r.id === selectedId);
  const selectedName = selectedRes?.name ?? selectedUser?.name ?? "";
  const selectedIcon = selectedRes?.icon_url ?? selectedUser?.icon_url;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-10 text-left text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selectedIcon
            ? <img src={selectedIcon} alt="" className="h-6 w-6 shrink-0 rounded object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            : selectedName
              ? <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-xs text-slate-400 dark:bg-slate-700">—</span>
              : null
          }
          <span className={selectedName ? "font-medium truncate" : "text-slate-500"}>
            {selectedName || "Kaynak seçin"}
          </span>
        </span>
        <ChevronDown className={`absolute right-3 h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="animate-dropdown-in absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-2 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Kaynak ara..."
                className="w-full rounded border border-slate-200 py-1.5 pl-8 pr-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredRes.length === 0 && filteredUser.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-slate-500">{search ? "Sonuç bulunamadı" : "Kaynak yok"}</p>
            )}
            {filteredRes.length > 0 && (
              <>
                <div className="border-b border-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-700">Hazır Kaynaklar</div>
                {filteredRes.map((r) => (
                  <button key={r.id} type="button"
                    onClick={() => { onSelect(r.id, false); setIsOpen(false); setSearch(""); }}
                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      selectedId === r.id ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {r.icon_url
                      ? <img src={r.icon_url} alt="" className="h-6 w-6 shrink-0 rounded object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      : <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-xs text-slate-400 dark:bg-slate-700">—</span>
                    }
                    {r.name}
                  </button>
                ))}
              </>
            )}
            {filteredUser.length > 0 && (
              <>
                <div className="border-t border-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-700">Kendi Kaynaklarım</div>
                {filteredUser.map((r) => (
                  <div key={r.id} className={`flex items-center justify-between gap-1 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 ${selectedId === r.id ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}>
                    <button type="button"
                      onClick={() => { onSelect(r.id, true); setIsOpen(false); setSearch(""); }}
                      className={`flex min-w-0 flex-1 items-center gap-2 text-left text-sm ${
                        selectedId === r.id ? "font-medium text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-xs text-slate-400 dark:bg-slate-700">—</span>
                      {r.name}
                    </button>
                    <button type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await onDeleteUser(r.id);
                        onUserChange((prev) => prev.filter((x) => x.id !== r.id));
                        if (selectedId === r.id) onSelect("", false);
                      }}
                      className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
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

/* ─── Kaynaklarım Tab ─── */
function KaynaklarimTab({
  subjects,
  initialUserResources,
  publishers,
  dersResources,
  denemeResources,
}: {
  subjects: Subject[];
  initialUserResources: UserResource[];
  publishers: Publisher[];
  dersResources: Resource[];
  denemeResources: Resource[];
}) {
  const { data: coachData, mutate: mutateCoach } = useCoachData();
  const [localUserResources, setLocalUserResources] = useState<UserResource[]>(initialUserResources);

  const allSystemResources: Resource[] = useMemo(() => [...dersResources, ...denemeResources], [dersResources, denemeResources]);
  const coachResourceIds: { t: "r" | "u"; id: string }[] = useMemo(
    () => (coachData?.coachResourceIds as { t: "r" | "u"; id: string }[] | undefined) ?? [],
    [coachData]
  );

  // Seçim state'leri: Ders -> Yayın evi -> Kitap
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedPublisherId, setSelectedPublisherId] = useState("");
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [isUserSelection, setIsUserSelection] = useState(false);

  // Varsayılan ders
  useEffect(() => {
    if (!selectedSubjectId && subjects[0]) setSelectedSubjectId(subjects[0].id);
  }, [subjects, selectedSubjectId]);

  // Özel kaynak
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState("");

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedSubject = selectedSubjectId ? subjects.find((s) => s.id === selectedSubjectId) : null;

  // Derse göre yayınevleri: Bu derste en az bir kaynağı olan yayınevleri
  const publishersForSubject = useMemo(() => {
    if (!selectedSubjectId || !selectedSubject?.name) return publishers;
    return publishers.filter((p) =>
      dersResources.some((r) => {
        if (r.publisher_id !== p.id) return false;
        if (r.subject_id) return r.subject_id === selectedSubjectId;
        return resourceMatchesSubject(r.name ?? "", selectedSubject.name);
      })
    );
  }, [publishers, dersResources, selectedSubjectId, selectedSubject?.name]);

  // Yayınevi + derse göre kitaplar (ders kaynakları derse göre filtrelenir; deneme her zaman gösterilir)
  const resourcesForPublisherAndSubject = useMemo(() => {
    if (!selectedPublisherId) return [];
    const fromPublisher = [...dersResources, ...denemeResources].filter((r) => r.publisher_id === selectedPublisherId);
    const isDeneme = (r: Resource) => denemeResources.some((dr) => dr.id === r.id);
    if (!selectedSubjectId || !selectedSubject?.name) return fromPublisher;
    return fromPublisher.filter((r) => {
      if (isDeneme(r)) return true;
      if (r.subject_id) return r.subject_id === selectedSubjectId;
      return resourceMatchesSubject(r.name ?? "", selectedSubject.name);
    });
  }, [dersResources, denemeResources, selectedPublisherId, selectedSubjectId, selectedSubject?.name]);

  // Seçilen kaynağın adı
  const selectedName = useMemo(() => {
    if (!selectedResourceId) return "";
    if (isUserSelection) return localUserResources.find((r) => r.id === selectedResourceId)?.name ?? "";
    return resourcesForPublisherAndSubject.find((r) => r.id === selectedResourceId)?.name ?? allSystemResources.find((r) => r.id === selectedResourceId)?.name ?? "";
  }, [selectedResourceId, isUserSelection, localUserResources, resourcesForPublisherAndSubject, allSystemResources]);

  // Mevcut AI kaynakları — hem sistem hem kullanıcı
  const savedResources = useMemo(() => {
    return coachResourceIds.map((c) => {
      if (c.t === "u") {
        const ur = (coachData?.userResources as UserResource[] | undefined)?.find((r) => r.id === c.id) ?? localUserResources.find((r) => r.id === c.id);
        return { key: `u:${c.id}`, id: c.id, t: c.t, name: ur?.name ?? "(silinmiş)" };
      }
      const sr = allSystemResources.find((r) => r.id === c.id);
      return { key: `r:${c.id}`, id: c.id, t: c.t, name: sr?.name ?? "(bilinmeyen)" };
    });
  }, [coachResourceIds, coachData?.userResources, localUserResources, allSystemResources]);

  function handleSelect(id: string, isUser: boolean) {
    setSelectedResourceId(id);
    setIsUserSelection(isUser);
    setError(null);
  }

  async function handleAddToList() {
    if (!selectedResourceId) { setError("Lütfen önce bir kaynak seçin."); return; }
    const key = `${isUserSelection ? "u" : "r"}:${selectedResourceId}` ;
    if (savedResources.some((r) => r.key === key)) { setError("Bu kaynak zaten listende."); return; }
    setSaving(true);
    setError(null);
    const next: { t: "r" | "u"; id: string }[] = [
      ...coachResourceIds,
      { t: isUserSelection ? "u" : "r", id: selectedResourceId },
    ];
    const res = await updateCoachResources(next);
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    mutateCoach();
    setSuccess(`"${selectedName}" AI Koç listenize eklendi!`);
    setSelectedResourceId("");
    setSelectedPublisherId("");
    setIsUserSelection(false);
    setTimeout(() => setSuccess(null), 3000);
  }

  async function handleAddCustom() {
    if (!customInput.trim()) return;
    setSaving(true);
    setError(null);
    const res = await addUserResource(customInput.trim());
    if (!res.id) { setSaving(false); setError(res.error ?? "Eklenemedi."); return; }
    const newItem: UserResource = { id: res.id!, name: customInput.trim() };
    setLocalUserResources((prev) => [...prev, newItem]);
    // Aynı zamanda AI listesine de ekle
    const next: { t: "r" | "u"; id: string }[] = [...coachResourceIds, { t: "u", id: res.id! }];
    await updateCoachResources(next);
    setSaving(false);
    mutateCoach();
    mutate(SWR_KEYS.gorevEkle);
    setCustomInput("");
    setShowCustomInput(false);
    setSuccess(`"${newItem.name}" AI Koç listenize eklendi!`);
    setTimeout(() => setSuccess(null), 3000);
  }

  async function handleRemove(item: { key: string; id: string; t: "r" | "u" }) {
    setSaving(true);
    const next = coachResourceIds.filter((c) => !(c.t === item.t && c.id === item.id));
    await updateCoachResources(next);
    if (item.t === "u") {
      await deleteUserResource(item.id);
      setLocalUserResources((prev) => prev.filter((r) => r.id !== item.id));
      mutate(SWR_KEYS.gorevEkle);
    }
    mutateCoach();
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      {/* AI bağlantı notu */}
      <div className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-800/50 dark:bg-indigo-900/20">
        <Brain className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
        <p className="text-xs text-indigo-700 dark:text-indigo-300">
          Buraya eklediğiniz kaynaklar <strong>AI Koç</strong>&apos;a otomatik iletilir. Koç, program hazırlarken yalnızca bu kaynakları kullanır.
        </p>
      </div>

      {/* Kaynak seçici kart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Kaynak Ekle</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Ders seçin, yayın evini seçin, kitabı bulup listeye ekleyin.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCustomInput((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <Plus className="h-3 w-3" />
            Aradığımı bulamıyorum
          </button>
        </div>

        {showCustomInput && (
          <div className="animate-panel-in mb-4 flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustom())}
              placeholder="Kaynak adı yazın (örn: Birey TYT Matematik)"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
            <button
              type="button"
              onClick={handleAddCustom}
              disabled={saving || !customInput.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
            >
              {saving ? "Ekleniyor..." : "Ekle"}
            </button>
          </div>
        )}

        <div className="space-y-3">
          <SubjectSelect
            subjects={subjects}
            selectedId={selectedSubjectId}
            onSelect={(id) => {
              setSelectedSubjectId(id);
              setSelectedPublisherId("");
              setSelectedResourceId("");
              setIsUserSelection(false);
            }}
          />
          <PublisherSelect
            publishers={publishersForSubject}
            selectedId={selectedPublisherId}
            onSelect={(id) => { setSelectedPublisherId(id); setSelectedResourceId(""); setIsUserSelection(false); }}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">Kitap / kaynak</label>
            {selectedPublisherId ? (
              <ResourceSelect
                resources={resourcesForPublisherAndSubject}
                userResources={localUserResources}
                selectedId={selectedResourceId}
                onSelect={handleSelect}
                onDeleteUser={async (id) => {
                  const next = coachResourceIds.filter((c) => !(c.t === "u" && c.id === id));
                  await updateCoachResources(next);
                  await deleteUserResource(id);
                  setLocalUserResources((prev) => prev.filter((r) => r.id !== id));
                  if (selectedResourceId === id) { setSelectedResourceId(""); setIsUserSelection(false); }
                  mutateCoach();
                  mutate(SWR_KEYS.gorevEkle);
                }}
                onUserChange={setLocalUserResources}
              />
            ) : (
              <div className="flex w-full items-center rounded-lg border border-slate-300 bg-slate-50 py-2 pl-3 text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
                Önce yayın evi seçin
              </div>
            )}
          </div>
        </div>

        {/* Ekle butonu */}
        <button
          type="button"
          onClick={handleAddToList}
          disabled={saving || !selectedResourceId}
          className="mt-4 w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Kaydediliyor..." : "Kaynağı Listeme Ekle"}
        </button>

        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        {success && <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">✓ {success}</p>}
      </div>

      {/* Kayıtlı kaynaklar listesi */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Kaynak Listem {savedResources.length > 0 && `(${savedResources.length})`}
        </p>
        {savedResources.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/40">
            <p className="text-sm text-slate-500 dark:text-slate-400">Henüz kaynak eklenmemiş</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Yukarıdan kaynak seçip "Kaynağı Listeme Ekle" butonuna basın</p>
          </div>
        ) : (
          savedResources.map((r) => (
            <div key={r.key} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${r.t === "r" ? "bg-blue-400" : "bg-indigo-400"}`} />
                <span className="text-sm font-medium text-slate-900 dark:text-white">{r.name}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{r.t === "r" ? "Hazır kaynak" : "Kişisel"}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(r)}
                disabled={saving}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── Ana bileşen ─── */
export function KonuTakipClient({
  tytSubjects,
  aytSubjects,
  subjects,
  completions,
  tytTopics,
  aytTopics,
  initialUserResources,
  publishers,
  dersResources,
  denemeResources,
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
          (c) => !(c.subject_id === subjectId && c.topic_name === topicName && c.exam_type === examFilter)
        );
      }
      return [...prev, { subject_id: subjectId, topic_name: topicName, exam_type: examFilter }];
    });
    mutate(SWR_KEYS.gorevEkle);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Konularım / Kaynaklarım</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Konu ilerlemenizi takip edin ve çalışmalarınızda kullandığınız kaynakları yönetin.
        </p>
      </div>

      {/* Ana sekme */}
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
          <div className="flex w-fit gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800/30">
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
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Yetişme Oranı</p>
              <p className="text-2xl font-bold text-indigo-500">%{yetismePct}</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${yetismePct}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{completedTopics} / {totalTopics} konu tamamlandı</p>
          </div>

          <div className="space-y-6">
            {subjectNames.map((subjName) => {
              const list = topics[subjName] ?? [];
              const sid = subjectMap.get(subjName);
              if (!sid || list.length === 0) return null;
              const done = list.filter((t) => isCompleted(localCompletions, sid, t, examFilter)).length;
              return (
                <div key={subjName} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                      <BookOpen className="h-4 w-4 text-indigo-500" />
                      {subjName}
                    </h3>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{done}/{list.length}</span>
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
                          {completed ? <Check className="h-4 w-4" /> : <Square className="h-4 w-4 text-slate-400" />}
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
        <KaynaklarimTab
          subjects={subjects}
          initialUserResources={initialUserResources}
          publishers={publishers}
          dersResources={dersResources}
          denemeResources={denemeResources}
        />
      )}
    </div>
  );
}
