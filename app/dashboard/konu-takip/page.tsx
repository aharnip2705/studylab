import { createClient } from "@/lib/supabase/server";
import { KonuTakipClient } from "./konu-takip-client";
import {
  TYT_TOPICS,
  AYT_TOPICS,
  getTopicsByExam,
} from "@/lib/curriculum";

const PROGRAM_ID = "11111111-1111-1111-1111-111111111111";

export default async function KonuTakipPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [subjectsRes, completionsRes] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name")
      .eq("program_id", PROGRAM_ID)
      .order("sort_order"),
    supabase
      .from("topic_completions")
      .select("subject_id, topic_name, exam_type")
      .eq("user_id", user.id),
  ]);

  const subjects = subjectsRes.data ?? [];
  const completions = (completionsRes.data ?? []).map((c) => ({
    subject_id: c.subject_id,
    topic_name: c.topic_name,
    exam_type: c.exam_type,
  }));

  const subjectMap = new Map(subjects.map((s) => [s.name, s.id]));
  const tytSubjects = Object.keys(TYT_TOPICS).filter((name) => subjectMap.has(name));
  const aytSubjects = Object.keys(AYT_TOPICS).filter((name) => subjectMap.has(name));

  return (
    <KonuTakipClient
      tytSubjects={tytSubjects}
      aytSubjects={aytSubjects}
      subjects={subjects}
      completions={completions}
      tytTopics={getTopicsByExam("tyt")}
      aytTopics={getTopicsByExam("ayt")}
    />
  );
}
