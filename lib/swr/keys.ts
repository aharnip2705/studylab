/** Merkezi SWR cache key'leri - sayfa geçişlerinde aynı key kullanılarak cache paylaşılır */

export const SWR_KEYS = {
  weeklyPlan: "swr:weekly-plan",
  videolar: "swr:videolar",
  stats: "swr:stats",
  gorevEkle: "swr:gorev-ekle",
  practiceExams: "swr:practice-exams",
  subscription: "swr:subscription",
} as const;
