"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfile, updateStudyField } from "@/lib/actions/profile";
import { STUDY_FIELD_OPTIONS, type StudyField } from "@/lib/study-field";
import { Button } from "@/components/ui/button";

interface ProfileAndFieldFormProps {
  fullName: string;
  email: string;
}

export function ProfileAndFieldForm({ fullName, email }: ProfileAndFieldFormProps) {
  const [studyField, setStudyField] = useState<StudyField | "">("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const profile = await getProfile();
      setStudyField((profile as { study_field?: StudyField } | null)?.study_field ?? "esit_agirlik");
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!studyField) return;
    setSaving(true);
    setMessage(null);
    const result = await updateStudyField(studyField as StudyField);
    setSaving(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Ayarlar kaydedildi. Panel güncellendi." });
      router.refresh();
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-slate-500">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-500 dark:text-slate-400">Ad Soyad</label>
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
          {fullName || "—"}
        </p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-500 dark:text-slate-400">E-posta</label>
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
          {email || "—"}
        </p>
        <p className="mt-1 text-xs text-slate-500">Ad soyad ve e-posta hesap oluşturulurken kaydedilir, değiştirilemez.</p>
      </div>
      <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
        <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">Alanınız Nedir?</h3>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Seçiminize göre panelde görünen dersler güncellenir.
        </p>
        <select
          value={studyField}
          onChange={(e) => setStudyField(e.target.value as StudyField)}
          className="mb-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        >
          {STUDY_FIELD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {message && (
        <p
          className={`text-sm ${
            message.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}
      <Button type="submit" disabled={saving}>
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </form>
  );
}
