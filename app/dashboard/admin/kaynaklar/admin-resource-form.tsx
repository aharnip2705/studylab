"use client";

import { useState, useEffect } from "react";
import { addResource } from "@/lib/actions/admin-resources";

type Publisher = { id: string; name: string; logo_url?: string | null };
type Subject = { id: string; name: string };

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  "matematik": ["matematik", "math", "sayısal", "türev", "integral", "geometri", "üçgen", "polinomlar", "fonksiyon"],
  "türkçe": ["türkçe", "türk dili", "fiilimsi", "paragraf", "sözcük", "anlam"],
  "fizik": ["fizik", "kuvvet", "hareket", "elektrik", "optik", "dalgalar"],
  "kimya": ["kimya", "asit", "baz", "tuz", "organik", "mol", "element"],
  "biyoloji": ["biyoloji", "hücre", "genetik", "ekosistem", "canlı"],
  "tarih": ["tarih", "osmanlı", "cumhuriyet", "inkılap"],
  "coğrafya": ["coğrafya", "iklim", "nüfus", "harita"],
  "felsefe": ["felsefe", "mantık", "psikoloji", "sosyoloji"],
  "edebiyat": ["edebiyat", "şiir", "roman", "hikaye", "divan"],
  "geometri": ["geometri", "üçgen", "alan", "çevre", "açı"],
};

function guessSubjectFromName(name: string, subjects: Subject[]): string {
  const norm = name.toLowerCase();
  for (const subj of subjects) {
    const sNorm = subj.name.toLowerCase();
    if (norm.includes(sNorm)) return subj.id;
  }
  for (const [subjKey, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (keywords.some((kw) => norm.includes(kw))) {
      const match = subjects.find((s) => s.name.toLowerCase().includes(subjKey));
      if (match) return match.id;
    }
  }
  return "";
}

function findPublisherByName(resourceName: string, publishers: Publisher[]): Publisher | null {
  const norm = resourceName.trim().toLowerCase();
  if (!norm) return null;
  const withLogos = publishers
    .filter((p) => p.logo_url && p.name.trim())
    .sort((a, b) => (b.name.length - a.name.length));
  for (const p of withLogos) {
    if (norm.includes(p.name.trim().toLowerCase())) return p;
  }
  return null;
}

export function AdminResourceForm({ publishers, subjects = [] }: { publishers: Publisher[]; subjects?: Subject[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedPublisherId, setSelectedPublisherId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [resourceName, setResourceName] = useState("");

  const selectedPublisher = publishers.find((p) => p.id === selectedPublisherId);

  useEffect(() => {
    if (selectedPublisher?.logo_url) setIconUrl(selectedPublisher.logo_url);
    else setIconUrl("");
  }, [selectedPublisher?.logo_url, selectedPublisherId]);

  useEffect(() => {
    const match = findPublisherByName(resourceName, publishers);
    if (match) {
      setSelectedPublisherId(match.id);
      if (match.logo_url) setIconUrl(match.logo_url);
    }
    // Auto-detect subject from name
    if (resourceName && subjects.length > 0) {
      const guessed = guessSubjectFromName(resourceName, subjects);
      if (guessed) setSelectedSubjectId(guessed);
    }
  }, [resourceName, publishers, subjects]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const publisher_id = (fd.get("publisher_id") as string)?.trim() || "";
    const name = resourceName.trim() || (fd.get("name") as string)?.trim() || "";
    const iconVal = (fd.get("icon_url") as string)?.trim() || iconUrl;
    const icon_url =
      iconVal && (iconVal.startsWith("http://") || iconVal.startsWith("https://")) ? iconVal : undefined;

    const res = await addResource({
      name,
      resource_type: (fd.get("resource_type") as "soru_bankasi" | "video_ders_kitabi" | "deneme_sinavi" | "diger") || "soru_bankasi",
      publisher_id,
      icon_url,
      subject_id: selectedSubjectId || null,
    });
    setLoading(false);
    if (res.error) setError(res.error);
    else {
      setSuccess(true);
      form.reset();
      setIconUrl("");
      setSelectedPublisherId("");
      setSelectedSubjectId("");
      setResourceName("");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      {error && (
        <p className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </p>
      )}
      {success && (
        <p className="mb-4 rounded-lg bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
          Kaynak eklendi.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="publisher_id" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Yayın evi
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <select
              id="publisher_id"
              name="publisher_id"
              required
              value={selectedPublisherId}
              onChange={(e) => setSelectedPublisherId(e.target.value)}
              className="min-w-[200px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Seçin...</option>
              {publishers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {selectedPublisher && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                {selectedPublisher.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedPublisher.logo_url}
                    alt={selectedPublisher.name}
                    className="h-8 w-8 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Kaynak adı (kitap / model)
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={resourceName}
            onChange={(e) => setResourceName(e.target.value)}
            placeholder="örn. TYT Matematik Karekök, AYT Denemesi Palme"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            İsimde yayınevi geçiyorsa (örn. Karekök, Palme) otomatik eşleştirilir.
          </p>
        </div>
        <div>
          <label htmlFor="resource_type" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Tip
          </label>
          <select
            id="resource_type"
            name="resource_type"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="soru_bankasi">Soru Bankası</option>
            <option value="video_ders_kitabi">Video Ders Kitabı</option>
            <option value="deneme_sinavi">Deneme Sınavı</option>
            <option value="diger">Diğer</option>
          </select>
        </div>
        {subjects.length > 0 && (
          <div>
            <label htmlFor="subject_id" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Ders <span className="text-slate-400">(otomatik algılanır, değiştirebilirsiniz)</span>
            </label>
            <select
              id="subject_id"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Ders seçin (opsiyonel)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="sm:col-span-2">
          <label htmlFor="icon_url" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Yayınevi logosu (URL veya yukarıdaki yayın evi logosu kullanılır)
          </label>
          <input
            id="icon_url"
            name="icon_url"
            type="url"
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
            placeholder="https://... veya yayın evi logosu otomatik gelir"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>
      <div className="mt-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Ekleniyor…" : "Kaynak Ekle"}
        </button>
      </div>
    </form>
  );
}
