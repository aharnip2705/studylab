"use client";

import { useState } from "react";
import { updateVideo, deleteVideo } from "@/lib/actions/admin-videos";

type Subject = { id: string; name: string; slug: string };
type Video = {
  id: string;
  video_id: string;
  title: string;
  topic: string | null;
  channel_id: string;
  duration_seconds: number | null;
  sort_order: number;
  is_active: boolean;
  subject_id: string;
  subjects: { name: string; slug: string } | { name: string; slug: string }[] | null;
};

export function AdminVideoList({
  videos,
  subjects,
}: {
  videos: Video[];
  subjects: Subject[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggleActive(v: Video) {
    setLoading(true);
    setError(null);
    const res = await updateVideo(v.id, { is_active: !v.is_active });
    setLoading(false);
    if (res.error) setError(res.error);
    else setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu videoyu silmek istediğinize emin misiniz?")) return;
    setLoading(true);
    setError(null);
    const res = await deleteVideo(id);
    setLoading(false);
    if (res.error) setError(res.error);
    else setEditingId(null);
  }

  if (videos.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
        Henüz video yok. Yukarıdaki formdan ekleyebilirsiniz.
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
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <th className="p-3 font-medium">Başlık</th>
              <th className="p-3 font-medium">Video ID</th>
              <th className="p-3 font-medium">Ders</th>
              <th className="p-3 font-medium">Konu</th>
              <th className="p-3 font-medium">Durum</th>
              <th className="p-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((v) => (
              <tr
                key={v.id}
                className={`border-b border-slate-100 dark:border-slate-700/50 ${
                  !v.is_active ? "opacity-60" : ""
                }`}
              >
                <td className="p-3 font-medium">{v.title}</td>
                <td className="p-3 text-slate-600 dark:text-slate-400">
                  {v.video_id}
                </td>
                <td className="p-3">
                  {Array.isArray(v.subjects)
                    ? v.subjects[0]?.name ?? "—"
                    : v.subjects?.name ?? "—"}
                </td>
                <td className="p-3 text-slate-600 dark:text-slate-400">
                  {v.topic ?? "—"}
                </td>
                <td className="p-3">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs ${
                      v.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                    }`}
                  >
                    {v.is_active ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(v)}
                    disabled={loading}
                    className="mr-2 text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400"
                  >
                    {v.is_active ? "Pasif yap" : "Aktif yap"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(v.id)}
                    disabled={loading}
                    className="text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
