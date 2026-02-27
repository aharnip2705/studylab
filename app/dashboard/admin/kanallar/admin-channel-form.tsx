"use client";

import { useState } from "react";
import { addChannel } from "@/lib/actions/admin-channels";

type Subject = { id: string; name: string; slug: string };

export function AdminChannelForm({ subjects }: { subjects: Subject[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const res = await addChannel({
      channel_id: (fd.get("channel_id") as string) || "",
      channel_name: (fd.get("channel_name") as string) || "",
      subject_id: (fd.get("subject_id") as string) || undefined,
    });
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSuccess(true);
    form.reset();
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
          Kanal eklendi.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="channel_id" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Kanal ID
          </label>
          <input
            id="channel_id"
            name="channel_id"
            type="text"
            placeholder="UC..."
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="channel_name" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Kanal Adı
          </label>
          <input
            id="channel_name"
            name="channel_name"
            type="text"
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="subject_id" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Ders (opsiyonel)
          </label>
          <select
            id="subject_id"
            name="subject_id"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="">Seçin</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Ekleniyor…" : "Kanal Ekle"}
        </button>
      </div>
    </form>
  );
}
