"use client";

import { useState } from "react";
import { updateChannel, deleteChannel } from "@/lib/actions/admin-channels";

type Subject = { id: string; name: string; slug: string };
type Channel = {
  id: string;
  channel_id: string;
  channel_name: string;
  subject_id: string | null;
  is_active: boolean;
  subjects: { name: string } | { name: string }[] | null;
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
