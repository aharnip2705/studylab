import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, createDataStreamResponse, formatDataStreamPart } from "ai";
import { filterSubjectDetailsByField } from "@/lib/exam-config";
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

    const apiKey = process.env.GEMINI_API_KEY || process.env.gemini_api_key;
    if (!apiKey) {
      return streamErrorResponse("AI servisi yapılandırılmamış. Vercel'de GEMINI_API_KEY tanımlayın.", 500);
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
          const filteredDetails = filterSubjectDetailsByField(
            e.subject_details,
            e.type?.toLowerCase() ?? "tyt",
            studyField as StudyField | null
          );
          let line = `${i + 1}. ${e.name} (${e.type}) → ${net.toFixed(1)} net (${e.correct}D/${e.wrong}Y, ${e.time}dk)`;
          if (filteredDetails && Object.keys(filteredDetails).length > 0) {
            const details = Object.entries(filteredDetails)
              .map(([s, d]) => `${s}: ${(d.correct - d.wrong * 0.25).toFixed(1)}net`)
              .join(" | ");
            line += `\n   [${details}]`;
          }
          return line;
        })
        .join("\n");
      contextParts.push(`Öğrenci deneme sonuçları:\n${lines}`);
    }
    if (studyField) contextParts.push(`Çalışma alanı: ${studyField}`);
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

    const planSystemPrompt = `Sen StudyLab platformunun YKS hazırlık koç yapay zekasısın.${contextStr}

Öğrenci haftalık çalışma programı istiyor. Verilerini analiz et, zayıf derslere fazla süre ayır.

SADECE aşağıdaki JSON formatını döndür. Başka hiçbir metin, açıklama, markdown veya yorum ekleme:
{"plan":[{"day":"Pazartesi","tasks":[{"subject":"Türkçe","duration_minutes":90,"description":"Fiilimsiler konu tekrarı"}]},{"day":"Salı","tasks":[]},{"day":"Çarşamba","tasks":[]},{"day":"Perşembe","tasks":[]},{"day":"Cuma","tasks":[]},{"day":"Cumartesi","tasks":[]},{"day":"Pazar","tasks":[]}]}

Kurallar: 7 gün (Pazartesi-Pazar). Her günde 2-4 görev. subject değerleri: Türkçe, Matematik, Fizik, Kimya, Biyoloji, Edebiyat, Tarih, Coğrafya, Felsefe. duration_minutes: 60-120 tam sayı.`;

    const chatSystemPrompt = `Sen StudyLab adlı platformun uzman YKS, LGS ve KPSS eğitim koçusun. Adın AI Mentör. Öğrencilerin deneme netlerini analiz eder, onlara stratejik, motive edici ve tamamen Türk eğitim sistemine (TYT/AYT/KPSS) uygun ders çalışma programları hazırlarsın. Yanıtların kısa, net, modern ve madde imli olmalı.${contextStr}`;

    const google = createGoogleGenerativeAI({ apiKey });
    const modelName = (process.env.GEMINI_MODEL as string | undefined) ?? "gemini-1.5-flash";

    const result = streamText({
      model: google(modelName),
      system: isPlanRequest ? planSystemPrompt : chatSystemPrompt,
      messages: messages.slice(-20).map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      })),
      maxTokens: isPlanRequest ? 2000 : 600,
      temperature: isPlanRequest ? 0.2 : 0.8,
    });

    function getErrorMessage(err: unknown): string {
      if (err == null) return "Beklenmeyen bir hata oluştu.";
      if (typeof err === "string") return err;
      if (err instanceof Error) {
        const msg = err.message?.toLowerCase() ?? "";
        if (msg.includes("api") || msg.includes("key") || msg.includes("401") || msg.includes("403"))
          return "AI servisi yapılandırılmamış veya API anahtarı geçersiz.";
        if (msg.includes("quota") || msg.includes("limit")) return "Kota aşıldı. Lütfen daha sonra tekrar deneyin.";
        if (msg.includes("pro abonelik") || msg.includes("oturum")) return err.message;
        return err.message || "AI yanıt verirken bir hata oluştu.";
      }
      return "AI yanıt verirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
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
