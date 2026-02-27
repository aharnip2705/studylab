"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfile, updateStudyField } from "@/lib/actions/profile";
import { STUDY_FIELD_OPTIONS, type StudyField } from "@/lib/study-field";
import { Button } from "@/components/ui/button";

export function StudyFieldSettings({ embedded }: { embedded?: boolean } = {}) {
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

  async function handleSave() {
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

  const wrapperClass = embedded ? "" : "rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900";

  if (loading) {
    return (
      <div className={wrapperClass || "p-4"}>
        <p className="text-slate-500">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
        Alanınız Nedir?
      </h2>
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
      {message && (
        <p
          className={`mb-4 text-sm ${
            message.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}
      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </div>
  );
}
