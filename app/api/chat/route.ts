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

    // Bağlam oluştur (alan dışı dersler filtrelenir)
    const contextParts: string[] = [];
    if (exams.length > 0) {
      const lines = exams
        .map((e, i) => {
          const net = e.correct - e.wrong * 0.25;
          const examType = e.type?.toLowerCase() as "tyt" | "ayt";
          const config = getExamConfig(examType ?? "tyt", studyField as StudyField | null);
          const subjectQs = config.subjectQuestions;
          const filteredDetails = filterSubjectDetailsByField(
            e.subject_details,
            examType ?? "tyt",
            studyField as StudyField | null
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
      contextParts.push(`Deneme sonuçları:\n${lines}\n\nNOT: Parantez içindeki soru sayısı o dersin sınavdaki toplam sorusudur. Zayıflığı net oranı (net/maxSoru) ile değerlendir, mutlak net sayısıyla değil.`);
    }
    if (studyField) contextParts.push(`Alan: ${studyField}`);
    if (tytTargetNet) contextParts.push(`TYT hedef net: ${tytTargetNet}`);
    if (aytTargetNet) contextParts.push(`AYT hedef net: ${aytTargetNet}`);
    const contextStr = contextParts.length > 0 ? `\n\n[Bağlam]\n${contextParts.join("\n")}` : "";

    // Son kullanıcı mesajına göre plan isteği tespiti
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const lastUserText = lastUserMsg?.content ?? "";
    const isPlanRequest =
      /program\s*oluştur|program\s*hazırla|plan\s*oluştur|plan\s*hazırla|haftalık\s*plan|program\s*yap|çalışma\s*programı/i.test(lastUserText) ||
      /^(hadi\s+)?(oluştur|hazırla|yap)\s*(bir)?\s*(program|plan)/i.test(lastUserText.trim()) ||
      /^(evet|tamam|e|olur)\s*$/i.test(lastUserText.trim());

    const planSystemPrompt = `Sen StudyLab'ın YKS koç yapay zekasısın.${contextStr}

Kullanıcı haftalık çalışma programı istiyor. Verilerini analiz et. Zayıflığı net oranına göre belirle (net/maxSoru), mutlak net sayısına göre değil. Düşük oranlı derslere daha fazla süre ayır.

SADECE aşağıdaki JSON formatını döndür. Başka HİÇBİR metin, açıklama, markdown, \`\`\`json etiketi EKLEME:
{"plan":[{"day":"Pazartesi","tasks":[{"subject":"Türkçe","duration_minutes":90,"description":"Fiilimsiler konu tekrarı"}]},{"day":"Salı","tasks":[]},{"day":"Çarşamba","tasks":[]},{"day":"Perşembe","tasks":[]},{"day":"Cuma","tasks":[]},{"day":"Cumartesi","tasks":[]},{"day":"Pazar","tasks":[]}]}

Kurallar: 7 gün (Pazartesi-Pazar). Her günde 2-4 görev. subject değerleri: Türkçe, Matematik, Fizik, Kimya, Biyoloji, Edebiyat, Tarih, Coğrafya, Felsefe. duration_minutes: 60-120 tam sayı. Sadece JSON döndür, başka hiçbir şey yazma.`;

    const chatSystemPrompt = `Sen StudyLab adlı platformun uzman YKS koçusun. Adın AI Mentör. Kullanıcıyla doğrudan "sen" diye hitap et, "öğrenci" deme. Deneme netlerini analiz eder, stratejik ve motive edici tavsiyeler verirsin. Yanıtların kısa, samimi ve Türk eğitim sistemine (TYT/AYT) uygun olsun. Zayıflığı değerlendirirken o dersin toplam soru sayısına göre net oranını dikkate al.${contextStr}`;

    const groq = createOpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
    const modelName = (process.env.GROQ_MODEL as string | undefined) ?? "llama-3.3-70b-versatile";

    const result = streamText({
      model: groq(modelName),
      system: isPlanRequest ? planSystemPrompt : chatSystemPrompt,
      messages: messages.slice(-20).map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      })),
      maxTokens: isPlanRequest ? 2000 : 600,
      temperature: isPlanRequest ? 0.2 : 0.8,
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
