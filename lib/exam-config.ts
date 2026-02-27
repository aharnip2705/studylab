import type { StudyField } from "./study-field";

export const TYT_CONFIG = {
  totalQuestions: 120,
  totalTimeMinutes: 165,
  subjects: ["Turkce", "Sosyal", "Matematik", "Fen"] as const,
  subjectQuestions: { Turkce: 40, Sosyal: 20, Matematik: 40, Fen: 20 },
} as const;

export const AYT_CONFIGS: Record<
  Exclude<StudyField, "tyt" | "dil">,
  { totalQuestions: number; totalTimeMinutes: number; subjects: readonly string[] }
> = {
  sayisal: {
    totalQuestions: 80,
    totalTimeMinutes: 180,
    subjects: ["Matematik", "Fizik", "Kimya", "Biyoloji"],
  },
  esit_agirlik: {
    totalQuestions: 80,
    totalTimeMinutes: 180,
    subjects: ["Matematik", "Edebiyat", "Tarih", "Cografya"],
  },
  sozel: {
    totalQuestions: 80,
    totalTimeMinutes: 180,
    subjects: ["Edebiyat", "Tarih", "Cografya", "Felsefe"],
  },
};

export function getExamConfig(
  examType: "tyt" | "ayt",
  studyField: StudyField | null
) {
  if (examType === "tyt") return TYT_CONFIG;
  const field = studyField === "tyt" || studyField === "dil" || !studyField ? "esit_agirlik" : studyField;
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
