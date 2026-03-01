import type { StudyField } from "./study-field";

/** TYT Soru Dağılımı (120 soru) */
export const TYT_SUBJECT_QUESTIONS: Record<string, number> = {
  Türkçe: 40,
  Matematik: 40,
  Tarih: 5,
  Coğrafya: 5,
  Felsefe: 5,
  "Din Kültürü": 5,
  Fizik: 7,
  Kimya: 7,
  Biyoloji: 6,
};

export const TYT_CONFIG = {
  totalQuestions: 120,
  totalTimeMinutes: 165,
  subjects: [
    "Türkçe",
    "Matematik",
    "Tarih",
    "Coğrafya",
    "Felsefe",
    "Din Kültürü",
    "Fizik",
    "Kimya",
    "Biyoloji",
  ] as const,
  subjectQuestions: TYT_SUBJECT_QUESTIONS,
};

/** AYT Soru Dağılımı - alan bazlı. Alan dışı dersler hariç. */
const AYT_SAYISAL = {
  totalQuestions: 80,
  totalTimeMinutes: 180,
  subjects: ["Matematik", "Fizik", "Kimya", "Biyoloji"] as const,
  subjectQuestions: { Matematik: 40, Fizik: 14, Kimya: 13, Biyoloji: 13 },
};

const AYT_ESIT_AGIRLIK = {
  totalQuestions: 80,
  totalTimeMinutes: 180,
  subjects: ["Matematik", "Edebiyat", "Tarih", "Coğrafya"] as const,
  subjectQuestions: { Matematik: 40, Edebiyat: 24, Tarih: 21, Coğrafya: 17 },
};

const AYT_SOZEL = {
  totalQuestions: 80,
  totalTimeMinutes: 180,
  subjects: ["Edebiyat", "Tarih", "Coğrafya", "Felsefe"] as const,
  subjectQuestions: { Edebiyat: 24, Tarih: 21, Coğrafya: 17, Felsefe: 12 },
};

export const AYT_CONFIGS: Record<
  Exclude<StudyField, "tyt" | "dil">,
  {
    totalQuestions: number;
    totalTimeMinutes: number;
    subjects: readonly string[];
    subjectQuestions: Record<string, number>;
  }
> = {
  sayisal: AYT_SAYISAL,
  esit_agirlik: AYT_ESIT_AGIRLIK,
  sozel: AYT_SOZEL,
};

export function getExamConfig(
  examType: "tyt" | "ayt",
  studyField: StudyField | null
) {
  if (examType === "tyt") return TYT_CONFIG;
  const field =
    studyField === "tyt" || studyField === "dil" || !studyField
      ? "esit_agirlik"
      : studyField;
  return AYT_CONFIGS[field];
}

export function calculateNet(correct: number, wrong: number): number {
  return correct - wrong * 0.25;
}

export function calculateTimePerQuestion(
  totalTimeMinutes: number,
  totalQuestions: number
): number {
  if (totalQuestions === 0) return 0;
  return (totalTimeMinutes * 60) / totalQuestions;
}

export function calculateSuccessRate(net: number, totalQuestions: number): number {
  if (totalQuestions === 0) return 0;
  return (net / totalQuestions) * 100;
}

/** Alan dışı dersleri filtreler - AI ve analizde kullanılır */
export function filterSubjectDetailsByField(
  details: Record<string, { correct: number; wrong: number }> | null,
  examType: string,
  studyField: StudyField | null
): Record<string, { correct: number; wrong: number }> | null {
  if (!details || Object.keys(details).length === 0) return null;
  if (examType === "tyt") return details; // TYT'de tüm dersler geçerli
  const config = getExamConfig(examType as "tyt" | "ayt", studyField);
  const allowed = new Set(config.subjects);
  const filtered: Record<string, { correct: number; wrong: number }> = {};
  for (const [subj, v] of Object.entries(details)) {
    if (allowed.has(subj)) filtered[subj] = v;
  }
  return Object.keys(filtered).length > 0 ? filtered : null;
}
