"use client";

import { useState, useRef } from "react";
import { updateSubjectIcon, uploadSubjectIconFile } from "@/lib/actions/admin-subjects";
import { HelpCircle, Upload, Link as LinkIcon } from "lucide-react";

type Subject = { id: string; name: string; slug: string; icon_url?: string | null };

export function AdminDersList({ subjects }: { subjects: Subject[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [localIcons, setLocalIcons] = useState<Record<string, string | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSave(id: string) {
    setLoading(id);
    setError(null);
    const res = await updateSubjectIcon(id, editUrl.trim() || null);
    setLoading(null);
    if (res.error) {
      setError(res.error);
    } else {
      setLocalIcons((prev) => ({ ...prev, [id]: editUrl.trim() || null }));
      setEditingId(null);
      window.location.reload();
    }
  }

  async function handleFileUpload(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(id);
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    const res = await uploadSubjectIconFile(id, formData);
    setLoading(null);
    e.target.value = "";
    if (res.error) {
      setError(res.error);
    } else {
      setEditingId(null);
      window.location.reload();
    }
  }

  if (subjects.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
        Ders bulunamadı.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => (
          <div
            key={s.id}
            className="animate-item-in flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-shadow duration-150 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              {(() => {
                const url = s.id in localIcons ? localIcons[s.id] : s.icon_url;
                return url && editingId !== s.id ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={s.name} className="h-10 w-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <HelpCircle className="h-6 w-6 text-slate-400" />
                );
              })()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900 dark:text-white">{s.name}</p>
              {editingId === s.id ? (
                <div className="animate-panel-in mt-2 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <LinkIcon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <input
                      type="url"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      placeholder="Doğrudan resim linki (örn. .../icon.png)"
                      title="Sayfa linki değil, doğrudan resim adresi girin"
                      className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleSave(s.id)}
                      disabled={loading === s.id || !editUrl.trim()}
                      className="shrink-0 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Link kaydet
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Upload className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => handleFileUpload(s.id, e)}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading === s.id}
                      className="rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      Bilgisayardan yükle
                    </button>
                    <span className="text-xs text-slate-500">(max 1 MB, PNG/JPG/SVG/WebP)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setEditingId(null); setEditUrl(""); }}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  >
                    İptal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setEditingId(s.id); setEditUrl(s.icon_url ?? ""); }}
                  className="mt-0.5 text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  {s.icon_url ? "Sembolü değiştir" : "Sembol ekle"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
