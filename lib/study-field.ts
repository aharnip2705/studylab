export type StudyField = "esit_agirlik" | "sayisal" | "sozel" | "dil" | "tyt";

export const STUDY_FIELD_OPTIONS: { value: StudyField; label: string }[] = [
  { value: "esit_agirlik", label: "Eşit Ağırlık" },
  { value: "sayisal", label: "Sayısal" },
  { value: "sozel", label: "Sözel" },
  { value: "dil", label: "Dil" },
  { value: "tyt", label: "Alanım yok - TYT" },
];

export function filterSubjectsByField<T extends { slug: string }>(
  subjects: T[],
  studyField: StudyField | null
): T[] {
  if (!studyField) return subjects;

  // Dil alanı: Yabancı dil görünür, Edebiyat hariç
  if (studyField === "dil") {
    return subjects.filter((s) => s.slug !== "edebiyat");
  }

  // Yabancı dil alanı hariç diğer tüm bölümlerde (Eşit Ağırlık, Sayısal, Sözel, TYT)
  // yabancı dili kullanıcı göremesin
  let filtered = subjects;
  if (studyField === "esit_agirlik" || studyField === "sozel") {
    filtered = subjects.filter((s) => s.slug !== "yabanci-dil");
  } else if (studyField === "tyt") {
    filtered = subjects.filter(
      (s) => s.slug !== "geometri" && s.slug !== "edebiyat" && s.slug !== "yabanci-dil"
    );
  } else if (studyField === "sayisal") {
    filtered = subjects.filter((s) => s.slug !== "edebiyat" && s.slug !== "yabanci-dil");
  }

  return filtered;
}
