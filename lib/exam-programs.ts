import type { ExamType } from "./study-field";

export const PROGRAM_IDS: Record<ExamType, string> = {
  YKS: "11111111-1111-1111-1111-111111111111",
  LGS: "22222222-2222-2222-2222-222222222222",
  KPSS: "33333333-3333-3333-3333-333333333333",
};

export function getProgramIdForExam(examType: ExamType | null): string {
  if (!examType) return PROGRAM_IDS.YKS;
  return PROGRAM_IDS[examType] ?? PROGRAM_IDS.YKS;
}
