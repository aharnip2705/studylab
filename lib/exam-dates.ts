import type { ExamType, StudyField } from "./study-field";

interface ExamDate {
  label: string;
  month: number; // 0-indexed (JS Date convention)
  day: number;
}

const EXAM_DATES_2026: Record<string, ExamDate> = {
  yks_tyt: { label: "YKS TYT", month: 5, day: 20 },
  yks_ayt: { label: "YKS AYT", month: 5, day: 21 },
  lgs: { label: "LGS", month: 5, day: 14 },
  kpss_lisans: { label: "KPSS Lisans", month: 8, day: 6 },
  kpss_onlisans: { label: "KPSS Önlisans", month: 9, day: 4 },
  kpss_ortaogretim: { label: "KPSS Ortaöğretim", month: 9, day: 25 },
};

const FALLBACK_MONTHS: Record<string, number> = {
  yks_tyt: 5,
  yks_ayt: 5,
  lgs: 5,
  kpss_lisans: 8,
  kpss_onlisans: 9,
  kpss_ortaogretim: 9,
};

function getExamKey(examType: ExamType, studyField: StudyField | null): string {
  if (examType === "LGS") return "lgs";
  if (examType === "YKS") return "yks_tyt";
  if (examType === "KPSS") {
    if (studyField === "kpss_onlisans") return "kpss_onlisans";
    if (studyField === "kpss_ortaogretim") return "kpss_ortaogretim";
    return "kpss_lisans";
  }
  return "yks_tyt";
}

export function getTargetExamDate(
  examType: ExamType,
  studyField: StudyField | null,
  targetYear: number
): { date: Date; label: string } {
  const key = getExamKey(examType, studyField);
  const known = EXAM_DATES_2026[key];

  if (targetYear === 2026 && known) {
    return {
      date: new Date(2026, known.month, known.day),
      label: known.label,
    };
  }

  const fallbackMonth = FALLBACK_MONTHS[key] ?? 5;
  const label = known?.label ?? "Sınav";
  return {
    date: new Date(targetYear, fallbackMonth, 1),
    label: `${label} ${targetYear}`,
  };
}

export function getCountdownValues(targetDate: Date) {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }

  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    totalMs: diff,
  };
}
