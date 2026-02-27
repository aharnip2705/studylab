"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface PracticeExam {
  id: string;
  user_id: string;
  exam_type: "tyt" | "ayt";
  exam_name: string;
  exam_date: string | null;
  total_correct: number;
  total_wrong: number;
  total_time_minutes: number;
  net_target: number | null;
  subject_details: Record<string, { correct: number; wrong: number }> | null;
  created_at: string;
}

export async function getPracticeExams(limit = 20): Promise<PracticeExam[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("practice_exams")
    .select("*")
    .eq("user_id", user.id)
    .order("exam_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as PracticeExam[];
}

export async function getRecentExams(count = 5): Promise<PracticeExam[]> {
  return getPracticeExams(count);
}

export async function addPracticeExam(input: {
  exam_type: "tyt" | "ayt";
  exam_name: string;
  exam_date: string;
  total_correct: number;
  total_wrong: number;
  total_time_minutes: number;
  net_target?: number | null;
  subject_details?: Record<string, { correct: number; wrong: number }> | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor" };

  const { error } = await supabase.from("practice_exams").insert({
    user_id: user.id,
    exam_type: input.exam_type,
    exam_name: input.exam_name.trim(),
    exam_date: input.exam_date,
    total_correct: input.total_correct,
    total_wrong: input.total_wrong,
    total_time_minutes: input.total_time_minutes,
    net_target: input.net_target ?? null,
    subject_details: input.subject_details ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/istatistikler");
  return { success: true };
}

export async function deletePracticeExam(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor" };

  const { error } = await supabase
    .from("practice_exams")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/istatistikler");
  return { success: true };
}
