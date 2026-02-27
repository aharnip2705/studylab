"use server";

import { createClient } from "@/lib/supabase/server";
import { filterSubjectsByField } from "@/lib/study-field";

const PROGRAM_ID = "11111111-1111-1111-1111-111111111111";
const DAY_LABELS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

export async function getStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Ders listesi şablonu (alan seçimine göre filtrelenmiş)
  let studyField: string | null = null;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("study_field")
      .eq("id", user.id)
      .single();
    studyField = (profile as { study_field?: string } | null)?.study_field ?? null;
  } catch {
    // study_field kolonu yoksa tüm dersler gösterilir
  }

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, slug")
    .eq("program_id", PROGRAM_ID)
    .order("sort_order");
  const filteredSubjects = filterSubjectsByField(subjects ?? [], studyField as Parameters<typeof filterSubjectsByField>[1]);

  const subjectTemplate = filteredSubjects.map((s) => ({
    name: s.name,
    tamamlandi: 0,
    kismen: 0,
    toplam: 0,
  }));

  const today = new Date();
  // Bu hafta: son 7 gün (bugün dahil)
  const thisWeekTemplate: { date: string; label: string; tamamlandi: number; kismen: number; toplam: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayNum = d.getDay();
    const dayLabel = dayNum === 0 ? "Paz" : DAY_LABELS[dayNum];
    thisWeekTemplate.push({
      date: dateStr,
      label: `${dayLabel} ${d.getDate()}`,
      tamamlandi: 0,
      kismen: 0,
      toplam: 0,
    });
  }

  const { data: plans } = await supabase
    .from("weekly_plans")
    .select("id")
    .eq("user_id", user.id);

  if (!plans?.length) {
    return {
      dailyData: thisWeekTemplate,
      subjectData: subjectTemplate,
      weeklyTotal: 0,
      previousWeekTotal: 0,
      previousWeekTopics: 0,
      thisWeekTopics: 0,
    };
  }

  const planIds = plans.map((p) => p.id);

  const { data: tasks } = await supabase
    .from("plan_tasks")
    .select(`
      task_date,
      status,
      question_count,
      solved_questions_count,
      subject_id,
      subjects(name)
    `)
    .in("weekly_plan_id", planIds)
    .not("task_date", "is", null);

  const dailyMap = new Map(thisWeekTemplate.map((d) => [d.date, { ...d }]));
  const subjectMap = new Map(
    subjectTemplate.map((s) => [s.name, { ...s }])
  );

  if (tasks?.length) {
    for (const t of tasks) {
      const task = t as {
        task_date: string;
        status: string;
        question_count?: number | null;
        solved_questions_count?: number | null;
        subject_id: string;
        subjects?: { name?: string } | null;
      };
      const count = task.question_count ?? 0;
      const solved = task.solved_questions_count;
      const kismenCount =
        task.status === "kismen_tamamlandi"
          ? solved != null && solved > 0
            ? solved
            : Math.round(count / 2)
          : 0;
      const subName = (task.subjects as { name?: string } | null)?.name ?? "Bilinmeyen";

      let sub = subjectMap.get(subName);
      if (!sub) {
        sub = { name: subName, tamamlandi: 0, kismen: 0, toplam: 0 };
        subjectMap.set(subName, sub);
      }

      if (task.status === "tamamlandi") {
        sub.tamamlandi += count;
        sub.toplam += count;
        const d = dailyMap.get(task.task_date);
        if (d) {
          d.tamamlandi += count;
          d.toplam += count;
        }
      } else if (task.status === "kismen_tamamlandi") {
        sub.kismen += kismenCount;
        sub.toplam += kismenCount;
        const d = dailyMap.get(task.task_date);
        if (d) {
          d.kismen += kismenCount;
          d.toplam += kismenCount;
        }
      }
    }
  }

  const dailyData = Array.from(dailyMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const subjectData = Array.from(subjectMap.values())
    .sort((a, b) => b.toplam - a.toplam);

  const weeklyTotal = dailyData.reduce((sum, d) => sum + d.toplam, 0);

  // Önceki hafta: 8-14 gün önce (bugünden 7 gün önceki 7 gün)
  const prevWeekStart = new Date(today);
  prevWeekStart.setDate(today.getDate() - 13);
  const prevWeekEnd = new Date(today);
  prevWeekEnd.setDate(today.getDate() - 7);
  const prevWeekStartStr = prevWeekStart.toISOString().split("T")[0];
  const prevWeekEndStr = prevWeekEnd.toISOString().split("T")[0];

  let previousWeekTotal = 0;
  let previousWeekTopics = 0;
  let thisWeekTopics = 0;

  if (tasks?.length) {
    for (const t of tasks) {
      const task = t as {
        task_date: string;
        status: string;
        question_count?: number | null;
        solved_questions_count?: number | null;
      };
      const count = task.question_count ?? 0;
      const solved = task.solved_questions_count;
      const kismenVal =
        task.status === "kismen_tamamlandi"
          ? solved != null && solved > 0
            ? solved
            : Math.round(count / 2)
          : 0;
      const isPrevWeek = task.task_date >= prevWeekStartStr && task.task_date <= prevWeekEndStr;
      const isThisWeek = dailyMap.has(task.task_date);

      if (task.status === "tamamlandi") {
        if (isPrevWeek) {
          previousWeekTotal += count;
          previousWeekTopics += 1;
        }
        if (isThisWeek) thisWeekTopics += 1;
      } else if (task.status === "kismen_tamamlandi") {
        if (isPrevWeek) {
          previousWeekTotal += kismenVal;
          previousWeekTopics += 1;
        }
        if (isThisWeek) thisWeekTopics += 1;
      }
    }
  }

  return {
    dailyData,
    subjectData,
    weeklyTotal,
    previousWeekTotal,
    previousWeekTopics,
    thisWeekTopics,
  };
}
