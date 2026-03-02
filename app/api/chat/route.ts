import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, createDataStreamResponse, formatDataStreamPart } from "ai";
import { filterSubjectDetailsByField, getExamConfig } from "@/lib/exam-config";
import type { StudyField } from "@/lib/study-field";

function streamErrorResponse(message: string, status: number) {
  return createDataStreamResponse({
    status,
    execute: (writer) => {
      writer.write(formatDataStreamPart("error", message));
    },
  });
}

interface ExamInput {
  name: string;
  type: string;
  correct: number;
  wrong: number;
  time: number;
  subject_details: Record<string, { correct: number; wrong: number }> | null;
}

interface TopicCompletion {
  subject: string;
  topic: string;
  examType: string;
}

interface CoachResource {
  t: "r" | "u";
  id: string;
  name?: string;
}

function buildContext(params: {
  exams: ExamInput[];
  studyField: string | null;
  tytTargetNet: number | null;
  aytTargetNet: number | null;
  topicCompletions: TopicCompletion[];
  coachResources: CoachResource[];
}) {
  const parts: string[] = [];

  if (params.exams.length > 0) {
    const lines = params.exams
      .map((e, i) => {
        const net = e.correct - e.wrong * 0.25;
        const examType = e.type?.toLowerCase() as "tyt" | "ayt";
        const config = getExamConfig(examType ?? "tyt", params.studyField as StudyField | null);
        const subjectQs = config.subjectQuestions;
        const filteredDetails = filterSubjectDetailsByField(
          e.subject_details,
          examType ?? "tyt",
          params.studyField as StudyField | null
        );
        let line = `${i + 1}. ${e.name} (${e.type}) → ${net.toFixed(1)} net (${e.correct}D/${e.wrong}Y, ${e.time}dk)`;
        if (filteredDetails && Object.keys(filteredDetails).length > 0) {
          const details = Object.entries(filteredDetails)
            .map(([s, d]) => {
              const maxQ = subjectQs[s];
              const subNet = d.correct - d.wrong * 0.25;
              const pct = maxQ ? `%${Math.round((subNet / maxQ) * 100)}` : "";
              return `${s}(${maxQ ?? "?"}soru): ${subNet.toFixed(1)}net ${pct}`;
            })
            .join(" | ");
          line += `\n   [${details}]`;
        }
        return line;
      })
      .join("\n");
    parts.push(`Deneme sonuçları:\n${lines}\n\nNOT: Zayıflığı net oranı (net/maxSoru) ile değerlendir.`);
  }

  if (params.topicCompletions.length > 0) {
    const bySubject: Record<string, string[]> = {};
    for (const c of params.topicCompletions) {
      const key = `${c.subject} (${c.examType.toUpperCase()})`;
      if (!bySubject[key]) bySubject[key] = [];
      bySubject[key].push(c.topic);
    }
    const topicLines = Object.entries(bySubject)
      .map(([subj, topics]) => `- ${subj}: ${topics.join(", ")}`)
      .join("\n");
    parts.push(`Tamamlanan konular (Konu Takip):\n${topicLines}\n\nBu konular BİTİRİLMİŞ. Programda tekrar önermek yerine sonraki konulara geç.`);
  } else {
    parts.push("Tamamlanan konu BİLGİSİ YOK. Kullanıcı Konu Takip sayfasından ilerlemesini işaretlememiş. Program istenirse deneme zayıflıklarından veya genel müfredat sırasından hareket et; konu bilgisi olmadığını belirt.");
  }

  if (params.coachResources.length > 0) {
    const names = params.coachResources.map((r) => r.name ?? r.id).filter(Boolean);
    parts.push(`Kullanıcının sahip olduğu kaynaklar (SADECE bunları programda kullan):\n${names.join("\n")}\n\nProgram hazırlarken SADECE bu listedeki kaynakları öner. Listede olmayan kitap/deneme önerme.`);
  } else {
    parts.push("Kullanıcı kaynak listesi EKLEMEMİŞ. Program hazırlarken genel kitap isimleri kullanabilirsin ama önce \"AI Koç içinde Kaynaklarım bölümünden sahip olduğun kitapları ekle, daha kişisel program hazırlayabilirim\" diye öner.");
  }

  if (params.studyField) parts.push(`Alan: ${params.studyField}`);
  if (params.tytTargetNet) parts.push(`TYT hedef net: ${params.tytTargetNet}`);
  if (params.aytTargetNet) parts.push(`AYT hedef net: ${params.aytTargetNet}`);

  return parts.length > 0 ? `\n\n[Kullanıcı Verileri]\n${parts.join("\n\n")}` : "";
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return streamErrorResponse("Oturum açmanız gerekiyor", 401);
    }

    let isAdmin = false;
    let planType = "free";
    try {
      const [{ data: sub }, { data: profile }] = await Promise.all([
        supabase.from("subscriptions").select("plan").eq("user_id", user.id).single(),
        supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
      ]);
      isAdmin = (profile as { is_admin?: boolean } | null)?.is_admin === true;
      planType = sub?.plan ?? "free";
    } catch {
      // subscriptions tablosu yoksa devam
    }

    if (!isAdmin && !["pro", "pro_trial"].includes(planType)) {
      return streamErrorResponse("Pro abonelik gerekli", 403);
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return streamErrorResponse("AI servisi yapılandırılmamış. Vercel'de GROQ_API_KEY tanımlayın.", 500);
    }

    const body = await req.json();
    const messages = (body.messages ?? []) as { role: string; content: string }[];
    const exams = (body.exams ?? []) as ExamInput[];
    const studyField = body.studyField as string | null;
    const tytTargetNet = body.tytTargetNet as number | null;
    const aytTargetNet = body.aytTargetNet as number | null;
    const topicCompletions = (body.topicCompletions ?? []) as TopicCompletion[];
    const coachResources = (body.coachResources ?? []) as CoachResource[];

    const contextStr = buildContext({
      exams,
      studyField,
      tytTargetNet,
      aytTargetNet,
      topicCompletions,
      coachResources,
    });

    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const lastUserText = lastUserMsg?.content ?? "";
    const isPlanRequest =
      /program\s*oluştur|program\s*hazırla|plan\s*oluştur|plan\s*hazırla|haftalık\s*plan|program\s*yap|çalışma\s*programı/i.test(lastUserText) ||
      /^(hadi\s+)?(oluştur|hazırla|yap)\s*(bir)?\s*(program|plan)/i.test(lastUserText.trim()) ||
      /^(evet|tamam|e|olur)\s*$/i.test(lastUserText.trim());

    const baseInstructions = `Sen StudyLab'ın uzman YKS hazırlık koçusun. Adın AI Mentör.
- Kullanıcıya "sen" diye hitap et, "öğrenci" deme.
- Türk eğitim sistemine (TYT/AYT, MEB müfredatı) göre tavsiye ver.
- Konuşma geçmişini MUTLAKA oku. Daha önce verdiğin önerileri TEKRARLAMA. Aynı soru tekrar gelirse farklı açı, derinlemesine analiz veya yeni perspektif sun.
- Bilgi yoksa uydurma. "Bu bilgiyi sistemde göremiyorum, Konu Takip / Kaynaklarım'dan ekleyebilirsin" de.${contextStr}`;

    const planSystemPrompt = `${baseInstructions}

Kullanıcı haftalık program istiyor. ÖNCE verilerini dikkatle analiz et:
1. Tamamlanan konular varsa onları ATLA, sonraki konulara geç.
2. Kaynak listesi varsa SADECE o kaynakları kullan; yoksa genel öner + kaynak eklemesini söyle.
3. Deneme zayıflıklarını net oranına göre belirle.
4. Programı DETAYLI ve UYGULANABİLİR yap; her görevde konu adı ve süre belirt.

SADECE aşağıdaki JSON formatını döndür. Başka HİÇBİR metin, \`\`\`json EKLEME:
{"plan":[{"day":"Pazartesi","tasks":[{"subject":"Türkçe","duration_minutes":90,"description":"Paragraf - anlam çıkarımı soruları"}]},{"day":"Salı","tasks":[]},{"day":"Çarşamba","tasks":[]},{"day":"Perşembe","tasks":[]},{"day":"Cuma","tasks":[]},{"day":"Cumartesi","tasks":[]},{"day":"Pazar","tasks":[]}]}

Kurallar: 7 gün (Pazartesi-Pazar). Her günde 2-4 görev. subject: Türkçe, Matematik, Fizik, Kimya, Biyoloji, Edebiyat, Tarih, Coğrafya, Felsefe. duration_minutes: 60-120. description kısa ve net. Sadece JSON.`;

    const chatSystemPrompt = `${baseInstructions}

Sohbet modundasın. Kısa, samimi, motive edici ama gerçekçi yanıtlar ver. Zayıflığı net oranıyla değerlendir. Tekrar önermekten kaçın.`;

    const groq = createOpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
    const modelName = (process.env.GROQ_MODEL as string | undefined) ?? "llama-3.3-70b-versatile";

    // Plan için daha düşük temp = daha tutarlı/az yaratıcı; sohbet için biraz yüksek
    const temperature = isPlanRequest ? 0.3 : 0.75;

    const result = streamText({
      model: groq(modelName),
      system: isPlanRequest ? planSystemPrompt : chatSystemPrompt,
      messages: messages.slice(-24).map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      })),
      maxTokens: isPlanRequest ? 2500 : 800,
      temperature,
    });

    function getErrorMessage(err: unknown): string {
      const raw = err instanceof Error ? err.message : String(err ?? "");
      console.error("[/api/chat] Groq error:", raw);
      if (!raw) return "Beklenmeyen bir hata oluştu.";
      if (/quota|rate.?limit/i.test(raw)) return "Kota aşıldı. Lütfen daha sonra tekrar deneyin.";
      return `AI hatası: ${raw}`;
    }

    return result.toDataStreamResponse({ getErrorMessage });
  } catch (err) {
    console.error("[/api/chat] error:", err);
    return streamErrorResponse(
      err instanceof Error ? err.message : "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.",
      500
    );
  }
}
