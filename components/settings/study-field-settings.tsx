"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfile, updateStudyField, updateExamType } from "@/lib/actions/profile";
import {
  STUDY_FIELD_OPTIONS,
  EXAM_TYPE_OPTIONS,
  getFieldsForExam,
  getExamTypeForField,
  type StudyField,
  type ExamType,
} from "@/lib/study-field";
import { Button } from "@/components/ui/button";

export function StudyFieldSettings({ embedded }: { embedded?: boolean } = {}) {
  const [examType, setExamType] = useState<ExamType | "">("");
  const [studyField, setStudyField] = useState<StudyField | "">("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const profile = await getProfile();
      const field = profile?.study_field ?? "esit_agirlik";
      setStudyField(field as StudyField);
      setExamType(profile?.exam_type ?? getExamTypeForField(field as StudyField));
      setLoading(false);
    }
    load();
  }, []);

  const availableFields = examType ? getFieldsForExam(examType as ExamType) : [];

  function handleExamTypeChange(type: ExamType) {
    setExamType(type);
    const fields = getFieldsForExam(type);
    if (fields.length === 1) {
      setStudyField(fields[0].value);
    } else {
      setStudyField("");
    }
  }

  async function handleSave() {
    if (!studyField || !examType) return;
    setSaving(true);
    setMessage(null);

    const [fieldResult, examResult] = await Promise.all([
      updateStudyField(studyField as StudyField),
      updateExamType(examType as ExamType),
    ]);

    setSaving(false);
    if (fieldResult.error || examResult.error) {
      setMessage({ type: "error", text: fieldResult.error || examResult.error || "Hata oluştu" });
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
        Sınav ve Alan Seçimi
      </h2>
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Seçiminize göre panelde görünen dersler ve içerikler güncellenir.
      </p>

      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Sınav Tipi
        </label>
        <select
          value={examType}
          onChange={(e) => handleExamTypeChange(e.target.value as ExamType)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        >
          <option value="" disabled>
            Seçin...
          </option>
          {EXAM_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} — {opt.description}
            </option>
          ))}
        </select>
      </div>

      {availableFields.length > 1 && (
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {examType === "YKS" ? "Alan" : "Eğitim Düzeyi"}
          </label>
          <select
            value={studyField}
            onChange={(e) => setStudyField(e.target.value as StudyField)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="" disabled>
              Seçin...
            </option>
            {availableFields.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {message && (
        <p
          className={`mb-4 text-sm ${
            message.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}
      <Button onClick={handleSave} disabled={saving || !studyField}>
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </div>
  );
}
