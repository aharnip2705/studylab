"use server";

import { createClient } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/actions/profile";
import { revalidatePath } from "next/cache";

const PROGRAM_ID = "11111111-1111-1111-1111-111111111111";

export async function getAdminSubjects() {
  if (!(await getIsAdmin())) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("id, name, slug")
    .eq("program_id", PROGRAM_ID)
    .order("sort_order");
  return data ?? [];
}

export async function getAdminVideos() {
  if (!(await getIsAdmin())) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("youtube_videos")
    .select(`
      id,
      video_id,
      title,
      topic,
      channel_id,
      duration_seconds,
      sort_order,
      is_active,
      subject_id,
      subjects(name, slug)
    `)
    .order("sort_order")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function addVideo(formData: {
  video_id: string;
  title: string;
  subject_id: string;
  topic?: string;
  channel_id?: string;
  duration_seconds?: number;
}) {
  if (!(await getIsAdmin())) return { error: "Yetkiniz yok" };
  const supabase = await createClient();
  const { error } = await supabase.from("youtube_videos").insert({
    video_id: formData.video_id.trim(),
    title: formData.title.trim(),
    subject_id: formData.subject_id,
    topic: formData.topic?.trim() || null,
    channel_id: formData.channel_id?.trim() || "UC_placeholder",
    duration_seconds: formData.duration_seconds || null,
    sort_order: 0,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/videolar");
  revalidatePath("/dashboard/videolar");
  return { success: true };
}

export async function updateVideo(
  id: string,
  updates: Partial<{
    video_id: string;
    title: string;
    subject_id: string;
    topic: string;
    channel_id: string;
    duration_seconds: number;
    sort_order: number;
    is_active: boolean;
  }>
) {
  if (!(await getIsAdmin())) return { error: "Yetkiniz yok" };
  const supabase = await createClient();
  const payload: Record<string, unknown> = {};
  if (updates.video_id !== undefined) payload.video_id = updates.video_id.trim();
  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.subject_id !== undefined) payload.subject_id = updates.subject_id;
  if (updates.topic !== undefined) payload.topic = updates.topic.trim() || null;
  if (updates.channel_id !== undefined) payload.channel_id = updates.channel_id.trim() || "UC_placeholder";
  if (updates.duration_seconds !== undefined) payload.duration_seconds = updates.duration_seconds;
  if (updates.sort_order !== undefined) payload.sort_order = updates.sort_order;
  if (updates.is_active !== undefined) payload.is_active = updates.is_active;
  const { error } = await supabase
    .from("youtube_videos")
    .update(payload)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/videolar");
  revalidatePath("/dashboard/videolar");
  return { success: true };
}

export async function deleteVideo(id: string) {
  if (!(await getIsAdmin())) return { error: "Yetkiniz yok" };
  const supabase = await createClient();
  const { error } = await supabase.from("youtube_videos").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/videolar");
  revalidatePath("/dashboard/videolar");
  return { success: true };
}
