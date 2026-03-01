"use client";

import { useState, useCallback, useEffect } from "react";
import { addPracticeExam } from "@/lib/actions/practice-exams";
import { getExamConfig, TYT_CONFIG } from "@/lib/exam-config";
import type { StudyField } from "@/lib/study-field";

interface ExamEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studyField: StudyField | null;
}

export function ExamEntryModal({
  open,
  onClose,
  onSuccess,
  studyField,
}: ExamEntryModalProps) {
  const [examType, setExamType] = useState<"tyt" | "ayt">("tyt");
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [totalCorrect, setTotalCorrect] = useState("");
  const [totalWrong, setTotalWrong] = useState("");
  const [totalTime, setTotalTime] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [subjectDetails, setSubjectDetails] = useState<
    Record<string, { correct: string; wrong: string }>
  >({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const config = getExamConfig(examType, studyField);
  const subjects = config.subjects;

  useEffect(() => {
    const init: Record<string, { correct: string; wrong: string }> = {};
    for (const s of subjects) {
      init[s] = { correct: "", wrong: "" };
    }
    setSubjectDetails(init);
  }, [examType, studyField]);

  const syncTotals = useCallback(
    (details: Record<string, { correct: string; wrong: string }>) => {
      let c = 0,
        w = 0;
      let anyFilled = false;
      for (const s of subjects) {
        const d = details[s];
        if (d) {
          const cv = parseInt(d.correct) || 0;
          const wv = parseInt(d.wrong) || 0;
          c += cv;
          w += wv;
          if (d.correct || d.wrong) anyFilled = true;
        }
      }
      if (anyFilled) {
        setTotalCorrect(String(c));
        setTotalWrong(String(w));
      }
    },
    [subjects]
  );

  function handleSubjectChange(
    subject: string,
    field: "correct" | "wrong",
    value: string
  ) {
    const next = { ...subjectDetails, [subject]: { ...subjectDetails[subject], [field]: value } };
    setSubjectDetails(next);
    syncTotals(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const c = parseInt(totalCorrect) || 0;
    const w = parseInt(totalWrong) || 0;
    const t = parseInt(totalTime) || 0;

    if (!examName.trim()) {
      setError("Deneme adı gerekli");
      return;
    }
    if (c + w > config.totalQuestions) {
      setError(`Toplam soru sayısı ${config.totalQuestions}'i geçemez`);
      return;
    }
    if (t <= 0) {
      setError("Süre giriniz");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosen = new Date(examDate);
    chosen.setHours(0, 0, 0, 0);
    if (chosen > today) {
      setError("Gelecek tarih seçilemez");
      return;
    }
    const twoYearsAgo = new Date(today);
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    if (chosen < twoYearsAgo) {
      setError("2 yıldan eski tarih seçilemez");
      return;
    }

    setSaving(true);

    const detailsPayload: Record<string, { correct: number; wrong: number }> = {};
    if (showDetails) {
      for (const s of subjects) {
        const d = subjectDetails[s];
        if (d && (d.correct || d.wrong)) {
          detailsPayload[s] = {
            correct: parseInt(d.correct) || 0,
            wrong: parseInt(d.wrong) || 0,
          };
        }
      }
    }

    const result = await addPracticeExam({
      exam_type: examType,
      exam_name: examName.trim(),
      exam_date: examDate,
      total_correct: c,
      total_wrong: w,
      total_time_minutes: t,
      net_target: null,
      subject_details: Object.keys(detailsPayload).length > 0 ? detailsPayload : null,
    });

    setSaving(false);
    if ("error" in result) {
      setError(result.error ?? "Bir hata oluştu");
      return;
    }
    resetForm();
    onSuccess();
    onClose();
  }

  function resetForm() {
    setExamName("");
    setExamDate(new Date().toISOString().slice(0, 10));
    setTotalCorrect("");
    setTotalWrong("");
    setTotalTime("");
    setShowDetails(false);
    setError("");
  }

  if (!open) return null;

  const defaultTime =
    examType === "tyt"
      ? TYT_CONFIG.totalTimeMinutes
      : 180;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="mx-4 flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-semibold text-white">Deneme Sonucu Ekle</h2>
          <button
            onClick={() => { resetForm(); onClose(); }}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden pt-4">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6 pt-4 pr-5">
          {/* Exam Type Toggle */}
          <div className="flex gap-2 rounded-xl bg-slate-800/60 p-1">
            {(["tyt", "ayt"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setExamType(t)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                  examType === t
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Exam Date */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Deneme Tarihi</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              min={(() => {
                const d = new Date();
                d.setFullYear(d.getFullYear() - 2);
                return d.toISOString().slice(0, 10);
              })()}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          {/* Exam Name */}
          <input
            type="text"
            placeholder="Deneme adı (örn: Palme TYT-3)"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
          />

          {/* Core Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Doğru</label>
              <input
                type="number"
                min={0}
                max={config.totalQuestions}
                value={totalCorrect}
                onChange={(e) => setTotalCorrect(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Yanlış</label>
              <input
                type="number"
                min={0}
                max={config.totalQuestions}
                value={totalWrong}
                onChange={(e) => setTotalWrong(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Süre (dk) <span className="text-slate-600">varsayılan {defaultTime}</span>
            </label>
            <input
              type="number"
              min={1}
              value={totalTime}
              onChange={(e) => setTotalTime(e.target.value)}
              placeholder={String(defaultTime)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            />
            <p className="mt-1 text-xs text-slate-600">Net hedefini Ayarlar sayfasından belirleyebilirsiniz.</p>
          </div>

          {/* Subject Details Toggle */}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 py-2.5 text-xs font-medium text-slate-400 transition-colors hover:border-indigo-500/50 hover:text-indigo-400"
          >
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              className={`transition-transform ${showDetails ? "rotate-180" : ""}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            Ders Bazlı Detay {showDetails ? "Gizle" : "Ekle"} (AI Analizini Güçlendir)
          </button>

          {showDetails && (
            <div className="space-y-2 rounded-xl border border-slate-700/50 bg-slate-800/30 p-3">
              {subjects.map((s) => (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-xs font-medium text-slate-300">
                    {s}
                    {(config as { subjectQuestions?: Record<string, number> }).subjectQuestions?.[s] != null && (
                      <span className="ml-1 font-normal text-slate-600">
                        ({(config as { subjectQuestions?: Record<string, number> }).subjectQuestions![s]} soru)
                      </span>
                    )}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={(config as { subjectQuestions?: Record<string, number> }).subjectQuestions?.[s] ?? undefined}
                    placeholder="D"
                    value={subjectDetails[s]?.correct ?? ""}
                    onChange={(e) => handleSubjectChange(s, "correct", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs text-emerald-400 outline-none focus:border-emerald-500"
                  />
                  <input
                    type="number"
                    min={0}
                    max={(config as { subjectQuestions?: Record<string, number> }).subjectQuestions?.[s] ?? undefined}
                    placeholder="Y"
                    value={subjectDetails[s]?.wrong ?? ""}
                    onChange={(e) => handleSubjectChange(s, "wrong", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs text-rose-400 outline-none focus:border-rose-500"
                  />
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-rose-400">{error}</p>
          )}
          </div>

          <div className="shrink-0 border-t border-slate-800 p-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-400 disabled:opacity-50"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
          </div>
        </form>
      </div>
    </div>
  );
}
