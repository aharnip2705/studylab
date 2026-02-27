"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getSavedVideoIds(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from("user_saved_videos")
      .select("video_id")
      .eq("user_id", user.id);
    return (data ?? []).map((r) => (r as { video_id: string }).video_id);
  } catch {
    return [];
  }
}

export type SavedVideo = {
  id: string;
  video_id: string;
  title: string;
  topic: string | null;
  duration_seconds: number | null;
  subject_id: string;
  subjects: { name: string } | { name: string }[] | null;
};

export async function getSavedVideos(): Promise<SavedVideo[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from("user_saved_videos")
      .select(`
        video_id,
        youtube_videos (
          id,
          video_id,
          title,
          topic,
          duration_seconds,
          subject_id,
          subjects(name)
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    const rows = data ?? [];
    return rows
      .filter((r) => (r as { youtube_videos: unknown }).youtube_videos)
      .map((r) => {
        const raw = (r as { youtube_videos: unknown }).youtube_videos;
        const v = Array.isArray(raw) ? raw[0] : raw;
        if (!v || typeof v !== "object") return null;
        const obj = v as Record<string, unknown>;
        return {
          id: String(obj.id ?? ""),
          video_id: String(obj.video_id ?? ""),
          title: String(obj.title ?? ""),
          topic: obj.topic != null ? String(obj.topic) : null,
          duration_seconds: obj.duration_seconds != null ? Number(obj.duration_seconds) : null,
          subject_id: String(obj.subject_id ?? ""),
          subjects: obj.subjects ?? null,
        };
      })
      .filter((x): x is SavedVideo => x !== null);
  } catch {
    return [];
  }
}

export async function toggleSaveVideo(youtubeVideoRowId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor" };
  const { data: existing } = await supabase
    .from("user_saved_videos")
    .select("id")
    .eq("user_id", user.id)
    .eq("video_id", youtubeVideoRowId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from("user_saved_videos")
      .delete()
      .eq("user_id", user.id)
      .eq("video_id", youtubeVideoRowId);
    if (error) return { error: error.message };
    revalidatePath("/dashboard/videolar");
    return { saved: false };
  } else {
    const { error } = await supabase
      .from("user_saved_videos")
      .insert({ user_id: user.id, video_id: youtubeVideoRowId });
    if (error) return { error: error.message };
    revalidatePath("/dashboard/videolar");
    return { saved: true };
  }
}

/** Playlist'ten gelen YouTube videoyu kütüphaneye ekleyip kaydeder */
export async function savePlaylistVideo(youtubeVideoId: string, title: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor" };

  const { data: sub } = await supabase
    .from("subjects")
    .select("id")
    .limit(1)
    .single();
  const subjectId = sub ? (sub as { id: string }).id : null;
  if (!subjectId) return { error: "Ders bulunamadı" };

  const { data: existingRow } = await supabase
    .from("youtube_videos")
    .select("id")
    .eq("video_id", youtubeVideoId)
    .maybeSingle();

  let rowId: string;
  if (existingRow) {
    rowId = (existingRow as { id: string }).id;
  } else {
    const { data: inserted } = await supabase
      .from("youtube_videos")
      .insert({
        video_id: youtubeVideoId,
        title: title.slice(0, 500),
        subject_id: subjectId,
        channel_id: "UC_placeholder",
        sort_order: 0,
      })
      .select("id")
      .single();
    if (!inserted) return { error: "Video eklenemedi" };
    rowId = (inserted as { id: string }).id;
  }

  const { data: alreadySaved } = await supabase
    .from("user_saved_videos")
    .select("id")
    .eq("user_id", user.id)
    .eq("video_id", rowId)
    .maybeSingle();

  if (alreadySaved) return { saved: true };

  const { error } = await supabase
    .from("user_saved_videos")
    .insert({ user_id: user.id, video_id: rowId });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/videolar");
  return { saved: true };
}
