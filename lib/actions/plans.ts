"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { filterSubjectsByField } from "@/lib/study-field";

const PROGRAM_ID = "11111111-1111-1111-1111-111111111111";

/** Verilen tarihin hafta başı (Pazartesi) YYYY-MM-DD olarak */
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

export async function getOrCreateWeeklyPlan() {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { plan: null, tasks: [] };

  const weekStart = getWeekStart(new Date());

  let { data: plan } = await supabase
    .from("weekly_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start_date", weekStart)
    .single();

  if (!plan) {
    const { data: newPlan, error } = await supabase
      .from("weekly_plans")
      .insert({ user_id: user.id, program_id: PROGRAM_ID, week_start_date: weekStart })
      .select()
      .single();
    if (error) return { plan: null, tasks: [] };
    plan = newPlan;
  }

  const { data: tasks, error: tasksError } = await supabase
    .from("plan_tasks")
    .select(`
      *,
      subjects(name, icon_url),
      resources(name),
      user_resources(name)
    `)
    .eq("weekly_plan_id", plan.id)
    .order("task_date")
    .order("created_at");

  // Ana sorgu hata verirse icon_url olmadan tekrar dene
  if (tasksError) {
    const { data: tasksFallback } = await supabase
      .from("plan_tasks")
      .select(`
        *,
        subjects(name, icon_url),
        resources(name),
        user_resources(name)
      `)
      .eq("weekly_plan_id", plan.id)
      .order("task_date")
      .order("created_at");
    return { plan, tasks: tasksFallback ?? [] };
  }

  return { plan, tasks: tasks ?? [] };
}

/** Belirli bir haftanın planını getir (geçmiş veya gelecek) */
export async function getWeeklyPlanByDate(weekStartDate: string) {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { plan: null, tasks: [] };

  const { data: plan } = await supabase
    .from("weekly_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start_date", weekStartDate)
    .single();

  if (!plan) return { plan: null, tasks: [] };

  const { data: tasks } = await supabase
    .from("plan_tasks")
    .select(`
      *,
      subjects(name, icon_url),
      resources(name),
      user_resources(name)
    `)
    .eq("weekly_plan_id", plan.id)
    .order("task_date")
    .order("created_at");

  return { plan, tasks: tasks ?? [] };
}

/** Kullanıcının tüm geçmiş hafta planlarını listele (tarih + görev sayısı) */
export async function getWeeklyPlanHistory() {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: plans } = await supabase
    .from("weekly_plans")
    .select("id, week_start_date")
    .eq("user_id", user.id)
    .order("week_start_date", { ascending: false });

  if (!plans || plans.length === 0) return [];

  const results: { week_start_date: string; task_count: number; completed: number; partial: number; failed: number }[] = [];

  for (const p of plans) {
    const { count: totalCount } = await supabase
      .from("plan_tasks")
      .select("*", { count: "exact", head: true })
      .eq("weekly_plan_id", p.id);

    const { count: completedCount } = await supabase
      .from("plan_tasks")
      .select("*", { count: "exact", head: true })
      .eq("weekly_plan_id", p.id)
      .eq("status", "tamamlandi");

    const { count: partialCount } = await supabase
      .from("plan_tasks")
      .select("*", { count: "exact", head: true })
      .eq("weekly_plan_id", p.id)
      .eq("status", "kismen_tamamlandi");

    const { count: failedCount } = await supabase
      .from("plan_tasks")
      .select("*", { count: "exact", head: true })
      .eq("weekly_plan_id", p.id)
      .eq("status", "tamamlanmadi");

    results.push({
      week_start_date: p.week_start_date,
      task_count: totalCount ?? 0,
      completed: completedCount ?? 0,
      partial: partialCount ?? 0,
      failed: failedCount ?? 0,
    });
  }

  return results;
}

/** Geçmiş haftanın planını mevcut haftaya kopyala */
export async function restoreWeeklyPlan(sourceWeekStart: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor" };

  const currentWeekStart = getWeekStart(new Date());
  if (sourceWeekStart === currentWeekStart) return { error: "Zaten mevcut haftadasınız" };

  const { data: sourcePlan } = await supabase
    .from("weekly_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_start_date", sourceWeekStart)
    .single();

  if (!sourcePlan) return { error: "Kaynak plan bulunamadı" };

  const { data: sourceTasks } = await supabase
    .from("plan_tasks")
    .select("day_of_week, subject_id, task_type, resource_id, user_resource_id, resource_name, question_count, youtube_video_id, target_duration")
    .eq("weekly_plan_id", sourcePlan.id);

  if (!sourceTasks || sourceTasks.length === 0) return { error: "Kaynak planda görev yok" };

  let { data: currentPlan } = await supabase
    .from("weekly_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_start_date", currentWeekStart)
    .single();

  if (!currentPlan) {
    const { data: newPlan, error } = await supabase
      .from("weekly_plans")
      .insert({ user_id: user.id, program_id: PROGRAM_ID, week_start_date: currentWeekStart })
      .select("id")
      .single();
    if (error) return { error: error.message };
    currentPlan = newPlan;
  }

  await supabase.from("plan_tasks").delete().eq("weekly_plan_id", currentPlan.id);

  const newTasks = sourceTasks.map((t) => {
    const ws = new Date(currentWeekStart + "T12:00:00");
    ws.setDate(ws.getDate() + (t.day_of_week - 1));
    const taskDate = `${ws.getFullYear()}-${String(ws.getMonth() + 1).padStart(2, "0")}-${String(ws.getDate()).padStart(2, "0")}`;
    return {
      weekly_plan_id: currentPlan.id,
      task_date: taskDate,
      day_of_week: t.day_of_week,
      subject_id: t.subject_id,
      task_type: t.task_type,
      resource_id: t.resource_id,
      user_resource_id: t.user_resource_id,
      resource_name: t.resource_name,
      question_count: t.question_count,
      youtube_video_id: t.youtube_video_id,
      target_duration: t.target_duration,
    };
  });

  const { error } = await supabase.from("plan_tasks").insert(newTasks);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true, count: newTasks.length };
}

export async function getSubjects() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let studyField: string | null = null;
  try {
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("study_field")
        .eq("id", user.id)
        .single();
      studyField = (profile as { study_field?: string } | null)?.study_field ?? null;
    }
  } catch {
    // study_field yoksa tüm dersler
  }

  const { data } = await supabase
    .from("subjects")
    .select("*")
    .eq("program_id", PROGRAM_ID)
    .order("sort_order");
  const all = data ?? [];
  return filterSubjectsByField(all, studyField as "esit_agirlik" | "sayisal" | "sozel" | "dil" | "tyt" | null);
}

export async function getPublishers() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("publishers")
    .select("id, name, sort_order, logo_url")
    .eq("program_id", PROGRAM_ID)
    .order("sort_order")
    .order("name");
  return data ?? [];
}

export async function getResources(type: "ders" | "deneme" = "ders") {
  const supabase = await createClient();
  const types = type === "deneme"
    ? ["deneme_sinavi"]
    : ["soru_bankasi", "video_ders_kitabi", "diger"];
  const { data, error } = await supabase
    .from("resources")
    .select("id, name, icon_url, publisher_id, subject_id")
    .eq("program_id", PROGRAM_ID)
    .in("resource_type", types)
    .order("name");
  if (error) {
    // subject_id column may not exist yet — fallback without it
    const { data: fallback } = await supabase
      .from("resources")
      .select("id, name, icon_url, publisher_id")
      .eq("program_id", PROGRAM_ID)
      .in("resource_type", types)
      .order("name");
    return (fallback ?? []).map((r) => ({ ...r, subject_id: null as string | null }));
  }
  return (data ?? []).map((r) => ({ ...r, subject_id: (r as { subject_id?: string | null }).subject_id ?? null }));
}

export async function getUserResources() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("user_resources")
    .select("*")
    .eq("user_id", user.id)
    .order("name");
  return data ?? [];
}

export async function addTask(formData: {
  task_date: string;
  day_of_week: number;
  subject_id?: string;
  task_type: "video" | "test" | "deneme";
  resource_id?: string;
  user_resource_id?: string;
  resource_name?: string;
  question_count?: number;
  youtube_video_id?: string;
  target_duration?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor" };

  const weekStart = getWeekStart(new Date(formData.task_date));

  let { data: plan } = await supabase
    .from("weekly_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_start_date", weekStart)
    .single();

  if (!plan) {
    const { data: newPlan, error } = await supabase
      .from("weekly_plans")
      .insert({ user_id: user.id, program_id: PROGRAM_ID, week_start_date: weekStart })
      .select("id")
      .single();
    if (error) return { error: error.message };
    plan = newPlan;
  }

  const { error } = await supabase.from("plan_tasks").insert({
    weekly_plan_id: plan.id,
    task_date: formData.task_date,
    day_of_week: formData.day_of_week,
    subject_id: formData.subject_id || null,
    task_type: formData.task_type,
    resource_id: formData.resource_id || null,
    user_resource_id: formData.user_resource_id || null,
    resource_name: formData.resource_name || null,
    question_count: formData.question_count ?? 0,
    youtube_video_id: formData.youtube_video_id || null,
    target_duration: formData.target_duration ?? 0,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/gorev-ekle");
  return { success: true };
}

export async function updateTaskStatus(
  taskId: string,
  status: "tamamlanmadi" | "kismen_tamamlandi" | "tamamlandi",
  extra?: { solved_questions_count?: number; excuse?: string | null }
) {
  if (status === "tamamlanmadi" && (!extra?.excuse || !String(extra.excuse).trim())) {
    return { error: "Tamamlanmadı olarak işaretlemek için mazeret girmeniz gerekiyor." };
  }
  const supabase = await createClient();
  const payload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (extra?.solved_questions_count != null) payload.solved_questions_count = extra.solved_questions_count;
  if (extra?.excuse !== undefined) payload.excuse = extra.excuse;
  const { error } = await supabase.from("plan_tasks").update(payload).eq("id", taskId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/istatistikler");
  return { success: true };
}

export async function updateTaskNotes(taskId: string, notes: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("plan_tasks")
    .update({ notes: notes ?? null, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}

export async function moveTask(taskId: string, newTaskDate: string, newDayOfWeek: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("plan_tasks")
    .update({
      task_date: newTaskDate,
      day_of_week: newDayOfWeek,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("plan_tasks").delete().eq("id", taskId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/istatistikler");
  return { success: true };
}

export async function addUserResource(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor", id: null };

  const { data, error } = await supabase
    .from("user_resources")
    .insert({ user_id: user.id, name: name.trim() })
    .select("id")
    .single();

  if (error) return { error: error.message, id: null };
  revalidatePath("/dashboard/gorev-ekle");
  return { success: true, id: data.id };
}

export async function deleteUserResource(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor" };

  // plan_tasks FK: önce ilgili görevlerde user_resource_id'yi null yap
  await supabase
    .from("plan_tasks")
    .update({ user_resource_id: null })
    .eq("user_resource_id", id);

  const { error } = await supabase
    .from("user_resources")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/gorev-ekle");
  revalidatePath("/dashboard");
  return { success: true };
}
