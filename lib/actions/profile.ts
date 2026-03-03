"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { StudyField, ExamType } from "@/lib/study-field";

export interface UserProfile {
  exam_type: ExamType | null;
  study_field: StudyField | null;
  target_year: number | null;
  full_name: string | null;
  tyt_target_net: number | null;
  ayt_target_net: number | null;
  coach_resource_ids: { t: "r" | "u"; id: string }[];
}

const DEFAULT_PROFILE: UserProfile = {
  exam_type: null,
  study_field: null,
  target_year: null,
  full_name: null,
  tyt_target_net: null,
  ayt_target_net: null,
  coach_resource_ids: [],
};

export async function getProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("exam_type, study_field, target_year, full_name, tyt_target_net, ayt_target_net, coach_resource_ids")
      .eq("id", user.id)
      .single();

    if (error) return { ...DEFAULT_PROFILE };

    return {
      exam_type: (data.exam_type as ExamType) ?? null,
      study_field: (data.study_field as StudyField) ?? null,
      target_year: data.target_year ?? null,
      full_name: data.full_name ?? null,
      tyt_target_net: data.tyt_target_net ?? null,
      ayt_target_net: data.ayt_target_net ?? null,
      coach_resource_ids: Array.isArray(data.coach_resource_ids) ? data.coach_resource_ids : [],
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export async function completeOnboarding(
  examType: ExamType,
  studyField: StudyField,
  targetYear: number
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Oturum açmanız gerekiyor" };

    const { error } = await supabase
      .from("profiles")
      .update({
        exam_type: examType,
        study_field: studyField,
        target_year: targetYear,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/ayarlar");
    revalidatePath("/dashboard/gorev-ekle");
    revalidatePath("/dashboard/istatistikler");
    revalidatePath("/dashboard/konu-takip");
    revalidatePath("/dashboard/videolar");
    return { success: true };
  } catch {
    return { error: "Bir hata oluştu. Lütfen tekrar deneyin." };
  }
}

export async function updateCoachResources(ids: { t: "r" | "u"; id: string }[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor" };

  const payload: Record<string, unknown> = {
    coach_resource_ids: ids,
    updated_at: new Date().toISOString(),
  };
  try {
    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", user.id);

    if (error) return { error: error.message };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kaydedilemedi";
    if (/column.*coach_resource_ids/i.test(msg)) {
      return { error: "Veritabanı güncellemesi gerekli. Migration 025: profiles tablosuna coach_resource_ids sütununu ekleyin." };
    }
    return { error: msg };
  }
  revalidatePath("/dashboard/istatistikler");
  revalidatePath("/dashboard/konu-takip");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTargetNets(tytTargetNet: number | null, aytTargetNet: number | null) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Oturum açmanız gerekiyor" };

    const { error } = await supabase
      .from("profiles")
      .update({ tyt_target_net: tytTargetNet, ayt_target_net: aytTargetNet, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) {
      if (error.message.includes("column") && error.message.includes("does not exist")) {
        return { error: "Veritabanına tyt_target_net ve ayt_target_net sütunları eklenmeli." };
      }
      return { error: error.message };
    }
    revalidatePath("/dashboard/ayarlar");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Bir hata oluştu." };
  }
}

export async function updateStudyField(studyField: StudyField) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Oturum açmanız gerekiyor" };

    const { error } = await supabase
      .from("profiles")
      .update({ study_field: studyField, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) return { error: "Alan seçimi kaydedilemedi. Veritabanı güncellemesi gerekebilir." };
    revalidatePath("/dashboard/ayarlar");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/gorev-ekle");
    revalidatePath("/dashboard/istatistikler");
    revalidatePath("/dashboard/videolar");
    return { success: true };
  } catch {
    return { error: "Bir hata oluştu. Lütfen tekrar deneyin." };
  }
}

export async function updateExamType(examType: ExamType) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Oturum açmanız gerekiyor" };

    const { error } = await supabase
      .from("profiles")
      .update({ exam_type: examType, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/ayarlar");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Bir hata oluştu." };
  }
}

/** Kullanıcının sınav tipine göre program UUID'sini döndürür */
export async function getCurrentUserProgramId(): Promise<string> {
  const YKS_PROGRAM_ID = "11111111-1111-1111-1111-111111111111";
  const KPSS_PROGRAM_ID = "22222222-2222-2222-2222-222222222222";
  const LGS_PROGRAM_ID = "33333333-3333-3333-3333-333333333333";

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return YKS_PROGRAM_ID;

    const { data } = await supabase
      .from("profiles")
      .select("exam_type")
      .eq("id", user.id)
      .single();

    const examType = (data as { exam_type?: string } | null)?.exam_type;
    if (examType === "KPSS") return KPSS_PROGRAM_ID;
    if (examType === "LGS") return LGS_PROGRAM_ID;
    return YKS_PROGRAM_ID;
  } catch {
    return YKS_PROGRAM_ID;
  }
}

export async function getIsAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    return (data as { is_admin?: boolean } | null)?.is_admin === true;
  } catch {
    return false;
  }
}

export async function updateFullName(fullName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor" };

  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName.trim() },
  });
  if (error) return { error: error.message };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName.trim(), updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (profileError) return { error: profileError.message };
  revalidatePath("/dashboard/ayarlar");
  revalidatePath("/dashboard");
  return { success: true };
}
