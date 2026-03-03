"use client";

import { useState } from "react";
import { updateChannel, deleteChannel } from "@/lib/actions/admin-channels";

type Subject = { id: string; name: string; slug: string };
type Channel = {
  id: string;
  channel_id: string;
  channel_name: string;
  subject_id: string | null;
  exam_type: string | null;
  is_active: boolean;
  subjects: { name: string } | { name: string }[] | null;
};

const EXAM_TYPE_LABELS: Record<string, string> = {
  YKS: "YKS",
  LGS: "LGS",
  KPSS: "KPSS",
};

const EXAM_TYPE_COLORS: Record<string, string> = {
  YKS: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  LGS: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  KPSS: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

export function AdminChannelList({
  channels,
  subjects,
}: {
  channels: Channel[];
  subjects: Subject[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editExamType, setEditExamType] = useState<string>("");

  async function handleToggleActive(c: Channel) {
    setLoading(true);
    setError(null);
    const res = await updateChannel(c.id, { is_active: !c.is_active });
    setLoading(false);
    if (res.error) setError(res.error);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu kanalı silmek istediğinize emin misiniz?")) return;
    setLoading(true);
    setError(null);
    const res = await deleteChannel(id);
    setLoading(false);
    if (res.error) setError(res.error);
  }

  async function handleSaveExamType(c: Channel) {
    setLoading(true);
    setError(null);
    const res = await updateChannel(c.id, { exam_type: editExamType || null });
    setLoading(false);
    if (res.error) setError(res.error);
    else setEditId(null);
  }

  if (channels.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
        Henüz kanal yok.
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
              <th className="p-3 font-medium">Kanal Adı</th>
              <th className="p-3 font-medium">Kanal ID</th>
              <th className="p-3 font-medium">Ders</th>
              <th className="p-3 font-medium">Sınav</th>
              <th className="p-3 font-medium">Durum</th>
              <th className="p-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((c) => (
              <tr
                key={c.id}
                className={`border-b border-slate-100 dark:border-slate-700/50 ${
                  !c.is_active ? "opacity-60" : ""
                }`}
              >
                <td className="p-3 font-medium">{c.channel_name}</td>
                <td className="p-3 text-slate-600 dark:text-slate-400">{c.channel_id}</td>
                <td className="p-3">
                  {Array.isArray(c.subjects)
                    ? c.subjects[0]?.name ?? "—"
                    : c.subjects?.name ?? "—"}
                </td>
                <td className="p-3">
                  {editId === c.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={editExamType}
                        onChange={(e) => setEditExamType(e.target.value)}
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="">Tümü</option>
                        <option value="YKS">YKS</option>
                        <option value="LGS">LGS</option>
                        <option value="KPSS">KPSS</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleSaveExamType(c)}
                        disabled={loading}
                        className="text-xs text-green-600 hover:underline dark:text-green-400"
                      >
                        Kaydet
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditId(null)}
                        className="text-xs text-slate-500 hover:underline"
                      >
                        İptal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditId(c.id);
                        setEditExamType(c.exam_type ?? "");
                      }}
                      className="group flex items-center gap-1"
                    >
                      {c.exam_type ? (
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            EXAM_TYPE_COLORS[c.exam_type] ?? ""
                          }`}
                        >
                          {EXAM_TYPE_LABELS[c.exam_type] ?? c.exam_type}
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                          Tümü
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        düzenle
                      </span>
                    </button>
                  )}
                </td>
                <td className="p-3">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs ${
                      c.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                    }`}
                  >
                    {c.is_active ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(c)}
                    disabled={loading}
                    className="mr-2 text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400"
                  >
                    {c.is_active ? "Pasif yap" : "Aktif yap"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
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
