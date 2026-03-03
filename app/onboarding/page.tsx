"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { completeOnboarding } from "@/lib/actions/profile";
import {
  EXAM_TYPE_OPTIONS,
  getFieldsForExam,
  type ExamType,
  type StudyField,
} from "@/lib/study-field";

const TARGET_YEARS_ANNUAL = [
  { value: 2026, label: "2026" },
  { value: 2027, label: "2027" },
];

const TARGET_YEARS_KPSS = [
  { value: 2026, label: "2026" },
  { value: 2028, label: "2028" },
];

function getTargetYears(examType: ExamType | null) {
  return examType === "KPSS" ? TARGET_YEARS_KPSS : TARGET_YEARS_ANNUAL;
}

const EXAM_ICONS: Record<ExamType, React.ReactNode> = {
  YKS: (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
    </svg>
  ),
  LGS: (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  KPSS: (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  ),
};

const pageTransition = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.98 },
  transition: { type: "spring" as const, stiffness: 200, damping: 28, mass: 0.8 },
};

const staggerChild = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [examType, setExamType] = useState<ExamType | null>(null);
  const [studyField, setStudyField] = useState<StudyField | null>(null);
  const [targetYear, setTargetYear] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = examType === "LGS" ? 2 : 3;
  const subFields = examType ? getFieldsForExam(examType) : [];
  const needsSubField = examType === "YKS" || examType === "KPSS";

  function handleExamSelect(type: ExamType) {
    setExamType(type);
    setStudyField(type === "LGS" ? "lgs" : null);
    setError(null);
    if (type === "LGS") {
      setStep(2);
    } else {
      setStep(2);
    }
  }

  function handleFieldSelect(field: StudyField) {
    setStudyField(field);
    setError(null);
    setStep(3);
  }

  function handleYearSelect(year: number) {
    setTargetYear(year);
    setError(null);
  }

  async function handleComplete() {
    if (!examType || !studyField || !targetYear) return;
    setSaving(true);
    setError(null);

    const result = await completeOnboarding(examType, studyField, targetYear);
    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  function goBack() {
    setError(null);
    if (step === 3) {
      setStep(needsSubField ? 2 : 1);
    } else if (step === 2) {
      setStep(1);
      setStudyField(null);
    }
  }

  const currentStepForYear = examType === "LGS" ? 2 : 3;
  const isYearStep =
    (examType === "LGS" && step === 2) || (examType !== "LGS" && step === 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-slate-50/80 backdrop-blur-2xl dark:bg-slate-950/80">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 24 }}
        className="relative z-10 w-full max-w-lg px-6"
      >
        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i + 1 <= step
                  ? "w-10 bg-primary-500"
                  : "w-6 bg-slate-300 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Exam Type */}
          {step === 1 && (
            <motion.div key="step1" {...pageTransition}>
              <div className="text-center mb-8">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl"
                >
                  Hedefinizi Belirleyin
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-2 text-slate-600 dark:text-slate-400"
                >
                  Hangi sınava hazırlanıyorsunuz?
                </motion.p>
              </div>

              <motion.div
                className="space-y-3"
                initial="initial"
                animate="animate"
                transition={{ staggerChildren: 0.08, delayChildren: 0.25 }}
              >
                {EXAM_TYPE_OPTIONS.map((opt) => (
                  <motion.button
                    key={opt.value}
                    variants={staggerChild}
                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
                    onClick={() => handleExamSelect(opt.value)}
                    className={`group flex w-full items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-300 ${
                      examType === opt.value
                        ? "border-primary-500 bg-primary-50 shadow-lg shadow-primary-500/10 dark:bg-primary-950/30"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                    }`}
                  >
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-xl transition-colors ${
                        examType === opt.value
                          ? "bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {EXAM_ICONS[opt.value]}
                    </div>
                    <div>
                      <span className="text-lg font-semibold text-slate-900 dark:text-white">
                        {opt.label}
                      </span>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {opt.description}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Step 2: Sub-category (YKS / KPSS) */}
          {step === 2 && needsSubField && (
            <motion.div key="step2" {...pageTransition}>
              <div className="text-center mb-8">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl"
                >
                  {examType === "YKS" ? "Alanınızı Seçin" : "Eğitim Düzeyiniz"}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-2 text-slate-600 dark:text-slate-400"
                >
                  {examType === "YKS"
                    ? "Hangi alandan sınava gireceksiniz?"
                    : "Hangi düzeyde sınava gireceksiniz?"}
                </motion.p>
              </div>

              <motion.div
                className="grid grid-cols-2 gap-3"
                initial="initial"
                animate="animate"
                transition={{ staggerChildren: 0.06, delayChildren: 0.2 }}
              >
                {subFields.map((opt) => (
                  <motion.button
                    key={opt.value}
                    variants={staggerChild}
                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
                    onClick={() => handleFieldSelect(opt.value)}
                    className={`rounded-2xl border-2 p-4 text-center transition-all duration-300 ${
                      studyField === opt.value
                        ? "border-primary-500 bg-primary-50 shadow-lg shadow-primary-500/10 dark:bg-primary-950/30"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                    }`}
                  >
                    <span className="text-base font-semibold text-slate-900 dark:text-white">
                      {opt.label}
                    </span>
                  </motion.button>
                ))}
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                onClick={goBack}
                className="mt-6 flex w-full items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
                </svg>
                Geri Dön
              </motion.button>
            </motion.div>
          )}

          {/* Year Selection Step */}
          {isYearStep && (
            <motion.div key="step-year" {...pageTransition}>
              <div className="text-center mb-8">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl"
                >
                  Hedef Yılınız
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-2 text-slate-600 dark:text-slate-400"
                >
                  Sınavınıza hangi yıl gireceksiniz?
                </motion.p>
              </div>

              <motion.div
                className="grid grid-cols-2 gap-4"
                initial="initial"
                animate="animate"
                transition={{ staggerChildren: 0.08, delayChildren: 0.2 }}
              >
                {getTargetYears(examType).map((opt) => (
                  <motion.button
                    key={opt.value}
                    variants={staggerChild}
                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
                    onClick={() => handleYearSelect(opt.value)}
                    className={`rounded-2xl border-2 p-6 text-center transition-all duration-300 ${
                      targetYear === opt.value
                        ? "border-primary-500 bg-primary-50 shadow-lg shadow-primary-500/10 dark:bg-primary-950/30"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                    }`}
                  >
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {opt.label}
                    </span>
                  </motion.button>
                ))}
              </motion.div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
                >
                  {error}
                </motion.p>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-8 flex flex-col gap-3"
              >
                <button
                  onClick={handleComplete}
                  disabled={!targetYear || saving}
                  className="w-full rounded-2xl bg-primary-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-primary-600/25 transition-all duration-300 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Kaydediliyor...
                    </span>
                  ) : (
                    "Hazırım, Başlayalım"
                  )}
                </button>

                <button
                  onClick={goBack}
                  className="flex w-full items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
                  </svg>
                  Geri Dön
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
