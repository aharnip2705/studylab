"use server";

import { createClient } from "@/lib/supabase/server";
import { filterSubjectsByField } from "@/lib/study-field";

const PROGRAM_ID = "11111111-1111-1111-1111-111111111111";

export async function getVideoSubjects() {
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
    .select("id, name, slug")
    .eq("program_id", PROGRAM_ID)
    .order("sort_order");
  const all = data ?? [];
  return filterSubjectsByField(all, studyField as Parameters<typeof filterSubjectsByField>[1]);
}

export async function getChannels() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("youtube_channels")
      .select("id, channel_id, channel_name, subject_id, subjects(name)")
      .eq("is_active", true)
      .order("channel_name");
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getVideos() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("youtube_videos")
      .select(`
        id,
        video_id,
        title,
        topic,
        duration_seconds,
        subject_id,
        channel_id,
        subjects(name)
      `)
      .eq("is_active", true)
      .order("sort_order")
      .order("created_at", { ascending: false });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getVideoTopics() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("youtube_videos")
      .select("topic")
      .eq("is_active", true)
      .not("topic", "is", null);

    if (error) return [];
    const topics = [...new Set((data ?? []).map((r) => (r as { topic: string }).topic).filter(Boolean))];
    return topics.sort();
  } catch {
    return [];
  }
}
