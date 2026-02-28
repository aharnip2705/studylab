"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { StudyField } from "@/lib/study-field";

export async function getProfile() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("study_field, full_name, tyt_target_net, ayt_target_net")
      .eq("id", user.id)
      .single();

    if (error) {
      return { study_field: "esit_agirlik" as StudyField, full_name: null, tyt_target_net: null, ayt_target_net: null };
    }
    return data;
  } catch {
    return { study_field: "esit_agirlik" as StudyField, full_name: null, tyt_target_net: null, ayt_target_net: null };
  }
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
        return { error: "Veritabanına tyt_target_net ve ayt_target_net sütunları eklenmeli. Supabase SQL Editor'dan: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tyt_target_net numeric, ADD COLUMN IF NOT EXISTS ayt_target_net numeric;" };
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
