"use server";

import { createClient } from "@/lib/supabase/server";
import { filterSubjectsByField } from "@/lib/study-field";
import { getCurrentUserProgramId } from "@/lib/actions/profile";

export async function getVideoSubjects() {
  const supabase = await createClient();
  const programId = await getCurrentUserProgramId();
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
    .eq("program_id", programId)
    .order("sort_order");
  const all = data ?? [];
  return filterSubjectsByField(all, studyField as Parameters<typeof filterSubjectsByField>[1]);
}

export async function getChannels() {
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("exam_type")
      .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
      .single();
    const examType = (profile as { exam_type?: string } | null)?.exam_type ?? null;

    let query = supabase
      .from("youtube_channels")
      .select("id, channel_id, channel_name, subject_id, exam_type, subjects(name)")
      .eq("is_active", true)
      .order("channel_name");

    if (examType) {
      query = query.or(`exam_type.is.null,exam_type.eq.${examType}`);
    }
    const { data, error } = await query;
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
