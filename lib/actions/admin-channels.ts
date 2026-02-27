"use server";

import { createClient } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/actions/profile";
import { revalidatePath } from "next/cache";

export async function getAdminChannels() {
  if (!(await getIsAdmin())) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("youtube_channels")
    .select("id, channel_id, channel_name, subject_id, is_active, subjects(name)")
    .order("channel_name");
  return data ?? [];
}

export async function addChannel(formData: {
  channel_id: string;
  channel_name: string;
  subject_id?: string;
}) {
  if (!(await getIsAdmin())) return { error: "Yetkiniz yok" };
  const supabase = await createClient();
  const { error } = await supabase.from("youtube_channels").insert({
    channel_id: formData.channel_id.trim(),
    channel_name: formData.channel_name.trim(),
    subject_id: formData.subject_id?.trim() || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/kanallar");
  return { success: true };
}

export async function updateChannel(
  id: string,
  updates: Partial<{ channel_id: string; channel_name: string; subject_id: string; is_active: boolean }>
) {
  if (!(await getIsAdmin())) return { error: "Yetkiniz yok" };
  const supabase = await createClient();
  const payload: Record<string, unknown> = {};
  if (updates.channel_id !== undefined) payload.channel_id = updates.channel_id.trim();
  if (updates.channel_name !== undefined) payload.channel_name = updates.channel_name.trim();
  if (updates.subject_id !== undefined) payload.subject_id = updates.subject_id || null;
  if (updates.is_active !== undefined) payload.is_active = updates.is_active;
  const { error } = await supabase.from("youtube_channels").update(payload).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/kanallar");
  return { success: true };
}

export async function deleteChannel(id: string) {
  if (!(await getIsAdmin())) return { error: "Yetkiniz yok" };
  const supabase = await createClient();
  const { error } = await supabase.from("youtube_channels").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/kanallar");
  return { success: true };
}
