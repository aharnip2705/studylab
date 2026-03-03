export type ExamType = "YKS" | "LGS" | "KPSS";

export type StudyField =
  | "esit_agirlik"
  | "sayisal"
  | "sozel"
  | "dil"
  | "tyt"
  | "lgs"
  | "kpss_lisans"
  | "kpss_onlisans"
  | "kpss_ortaogretim";

export const EXAM_TYPE_OPTIONS: { value: ExamType; label: string; description: string }[] = [
  { value: "YKS", label: "YKS", description: "Yükseköğretim Kurumları Sınavı" },
  { value: "LGS", label: "LGS", description: "Liselere Geçiş Sınavı" },
  { value: "KPSS", label: "KPSS", description: "Kamu Personeli Seçme Sınavı" },
];

export const STUDY_FIELD_OPTIONS: { value: StudyField; label: string; examType: ExamType }[] = [
  { value: "sayisal", label: "Sayısal", examType: "YKS" },
  { value: "esit_agirlik", label: "Eşit Ağırlık", examType: "YKS" },
  { value: "sozel", label: "Sözel", examType: "YKS" },
  { value: "dil", label: "Yabancı Dil", examType: "YKS" },
  { value: "tyt", label: "Alanım yok — Sadece TYT", examType: "YKS" },
  { value: "lgs", label: "LGS", examType: "LGS" },
  { value: "kpss_lisans", label: "Lisans", examType: "KPSS" },
  { value: "kpss_onlisans", label: "Önlisans", examType: "KPSS" },
  { value: "kpss_ortaogretim", label: "Ortaöğretim", examType: "KPSS" },
];

export function getFieldsForExam(examType: ExamType) {
  return STUDY_FIELD_OPTIONS.filter((o) => o.examType === examType);
}

export function getExamTypeForField(field: StudyField): ExamType {
  const match = STUDY_FIELD_OPTIONS.find((o) => o.value === field);
  return match?.examType ?? "YKS";
}

export function getFieldLabel(field: StudyField | null): string {
  if (!field) return "";
  return STUDY_FIELD_OPTIONS.find((o) => o.value === field)?.label ?? field;
}

export function filterSubjectsByField<T extends { slug: string }>(
  subjects: T[],
  studyField: StudyField | null
): T[] {
  if (!studyField) return subjects;

  if (studyField === "dil") {
    return subjects.filter((s) => s.slug !== "edebiyat");
  }

  if (studyField === "esit_agirlik" || studyField === "sozel") {
    return subjects.filter((s) => s.slug !== "yabanci-dil");
  }

  if (studyField === "tyt") {
    return subjects.filter(
      (s) => s.slug !== "geometri" && s.slug !== "edebiyat" && s.slug !== "yabanci-dil"
    );
  }

  if (studyField === "sayisal") {
    return subjects.filter((s) => s.slug !== "edebiyat" && s.slug !== "yabanci-dil");
  }

  // LGS ve KPSS: henüz ders filtresi yok, tüm dersleri döndür
  return subjects;
}
