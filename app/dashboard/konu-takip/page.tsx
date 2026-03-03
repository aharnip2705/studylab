import { createClient } from "@/lib/supabase/server";
import { KonuTakipClient } from "./konu-takip-client";
import {
  TYT_TOPICS,
  AYT_TOPICS,
  getTopicsByProgram,
  getExamSections,
} from "@/lib/curriculum";
import { getUserResources, getPublishers, getResources } from "@/lib/actions/plans";
import { getCurrentUserProgramId } from "@/lib/actions/profile";

export default async function KonuTakipPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const programId = await getCurrentUserProgramId();

  const { data: profile } = await supabase
    .from("profiles")
    .select("exam_type")
    .eq("id", user.id)
    .single();
  const examType = (profile as { exam_type?: string } | null)?.exam_type ?? "YKS";
  const programExamType = (examType === "KPSS" || examType === "LGS" ? examType : "YKS") as "YKS" | "LGS" | "KPSS";

  const [subjectsRes, completionsRes, userResources, publishers, dersResources, denemeResources] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name, icon_url")
      .eq("program_id", programId)
      .order("sort_order"),
    supabase
      .from("topic_completions")
      .select("subject_id, topic_name, exam_type")
      .eq("user_id", user.id),
    getUserResources(),
    getPublishers(),
    getResources("ders"),
    getResources("deneme"),
  ]);

  const subjects = subjectsRes.data ?? [];
  const completions = (completionsRes.data ?? []).map((c) => ({
    subject_id: c.subject_id,
    topic_name: c.topic_name,
    exam_type: c.exam_type,
  }));

  const subjectMap = new Map(subjects.map((s) => [s.name, s.id]));

  const examSections = getExamSections(programExamType);

  let tytSubjects: string[] = [];
  let aytSubjects: string[] = [];
  let kpssSubjects: string[] = [];
  let lgsSubjects: string[] = [];
  let tytTopics = TYT_TOPICS;
  let aytTopics = AYT_TOPICS;
  let kpssTopics: Record<string, string[]> = {};
  let lgsTopics: Record<string, string[]> = {};

  if (programExamType === "YKS") {
    tytSubjects = Object.keys(TYT_TOPICS).filter((name) => subjectMap.has(name));
    aytSubjects = Object.keys(AYT_TOPICS).filter((name) => subjectMap.has(name));
  } else if (programExamType === "KPSS") {
    kpssTopics = getTopicsByProgram("KPSS");
    // DB'de KPSS dersleri varsa eşleştir, yoksa müfredattan tümünü göster
    kpssSubjects = subjects.length > 0
      ? Object.keys(kpssTopics).filter((name) => subjectMap.has(name))
      : Object.keys(kpssTopics);
  } else {
    lgsTopics = getTopicsByProgram("LGS");
    // DB'de LGS dersleri varsa eşleştir, yoksa müfredattan tümünü göster
    lgsSubjects = subjects.length > 0
      ? Object.keys(lgsTopics).filter((name) => subjectMap.has(name))
      : Object.keys(lgsTopics);
  }

  return (
    <KonuTakipClient
      programExamType={programExamType}
      tytSubjects={tytSubjects}
      aytSubjects={aytSubjects}
      kpssSubjects={kpssSubjects}
      lgsSubjects={lgsSubjects}
      subjects={subjects}
      completions={completions}
      tytTopics={tytTopics}
      aytTopics={aytTopics}
      kpssTopics={kpssTopics}
      lgsTopics={lgsTopics}
      examSections={examSections}
      initialUserResources={userResources}
      publishers={publishers}
      dersResources={dersResources}
      denemeResources={denemeResources}
    />
  );
}
