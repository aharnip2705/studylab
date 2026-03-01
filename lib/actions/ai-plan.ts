"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const PROGRAM_ID = "11111111-1111-1111-1111-111111111111";

const DAY_MAP: Record<string, number> = {
  pazartesi: 1,
  salı: 2,
  sali: 2,
  çarşamba: 3,
  carsamba: 3,
  perşembe: 4,
  persembe: 4,
  cuma: 5,
  cumartesi: 6,
  pazar: 7,
};

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  d.setDate(diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dayNum = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dayNum}`;
}

function getDateForDayOfWeek(weekStart: string, dayOfWeek: number): string {
  const ws = new Date(weekStart + "T12:00:00");
  const offset = dayOfWeek - 1;
  ws.setDate(ws.getDate() + offset);
  const y = ws.getFullYear();
  const m = String(ws.getMonth() + 1).padStart(2, "0");
  const d = String(ws.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface AiPlanTask {
  subject: string;
  duration_minutes: number;
  description: string;
}

interface AiPlanDay {
  day: string;
  tasks: AiPlanTask[];
}

export async function applyAiPlan(plan: AiPlanDay[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor" };

  const weekStart = getWeekStart(new Date());

  let { data: weeklyPlan } = await supabase
    .from("weekly_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_start_date", weekStart)
    .single();

  if (!weeklyPlan) {
    const { data: newPlan, error } = await supabase
      .from("weekly_plans")
      .insert({
        user_id: user.id,
        program_id: PROGRAM_ID,
        week_start_date: weekStart,
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    weeklyPlan = newPlan;
  }

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("program_id", PROGRAM_ID);

  const subjectMap = new Map(
    (subjects ?? []).map((s) => [s.name.toLowerCase(), s.id])
  );

  const rows: {
    weekly_plan_id: string;
    task_date: string;
    day_of_week: number;
    subject_id: string | null;
    task_type: string;
    resource_name: string;
    question_count: number;
    target_duration: number;
  }[] = [];

  for (const dayEntry of plan) {
    const dayKey = dayEntry.day
      .toLowerCase()
      .replace(/ı/g, "i")
      .replace(/ş/g, "s")
      .replace(/ç/g, "c")
      .replace(/ö/g, "o")
      .replace(/ü/g, "u")
      .replace(/ğ/g, "g")
      .trim();
    const dayOfWeek = DAY_MAP[dayKey] ?? DAY_MAP[dayEntry.day.toLowerCase()] ?? 1;
    const taskDate = getDateForDayOfWeek(weekStart, dayOfWeek);

    for (const task of dayEntry.tasks) {
      const subjectId =
        subjectMap.get(task.subject.toLowerCase()) ??
        subjectMap.get(task.subject.toLowerCase().replace("ü", "u").replace("ö", "o").replace("ç", "c").replace("ş", "s").replace("ı", "i").replace("ğ", "g")) ??
        null;

      rows.push({
        weekly_plan_id: weeklyPlan.id,
        task_date: taskDate,
        day_of_week: dayOfWeek,
        subject_id: subjectId,
        task_type: "test",
        resource_name: task.description,
        question_count: 0,
        target_duration: task.duration_minutes,
      });
    }
  }

  if (rows.length === 0) return { error: "Eklenecek görev bulunamadı" };

  const { error: deleteError } = await supabase
    .from("plan_tasks")
    .delete()
    .eq("weekly_plan_id", weeklyPlan.id);
  if (deleteError) return { error: deleteError.message };

  const { error } = await supabase.from("plan_tasks").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/istatistikler");
  return { success: true, count: rows.length };
}
