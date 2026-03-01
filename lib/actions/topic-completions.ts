"use server";

import { createClient } from "@/lib/supabase/server";

export async function getTopicCompletions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { completions: [] };

  const { data } = await supabase
    .from("topic_completions")
    .select("subject_id, topic_name, exam_type")
    .eq("user_id", user.id);

  return {
    completions: (data ?? []).map((r) => ({
      subject_id: r.subject_id,
      topic_name: r.topic_name,
      exam_type: r.exam_type,
    })),
  };
}

export async function toggleTopicCompletion(
  subjectId: string,
  topicName: string,
  examType: "tyt" | "ayt"
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açmanız gerekiyor" };

  const { data: existing } = await supabase
    .from("topic_completions")
    .select("id")
    .eq("user_id", user.id)
    .eq("subject_id", subjectId)
    .eq("topic_name", topicName)
    .eq("exam_type", examType)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("topic_completions")
      .delete()
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("topic_completions").insert({
      user_id: user.id,
      subject_id: subjectId,
      topic_name: topicName,
      exam_type: examType,
    });
    if (error) return { error: error.message };
  }
  return {};
}
