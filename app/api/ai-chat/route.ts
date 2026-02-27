import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ExamSummary {
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
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    let isAdmin = false;
    let plan = "free";
    try {
      const [{ data: sub }, { data: profile }] = await Promise.all([
        supabase.from("subscriptions").select("plan").eq("user_id", user.id).single(),
        supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
      ]);
      isAdmin = (profile as { is_admin?: boolean } | null)?.is_admin === true;
      plan = sub?.plan ?? "free";
    } catch {
      // subscriptions tablosu yoksa
    }
    if (!isAdmin && !["pro", "pro_trial"].includes(plan)) {
      return NextResponse.json(
        { error: "Pro abonelik gerekli" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const message = body.message as string;
    const exams = (body.exams ?? []) as ExamSummary[];
    const studyField = body.studyField as string | null;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Mesaj gerekli" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI servisi yapılandırılmamış" },
        { status: 500 }
      );
    }

    const contextParts: string[] = [];
    if (exams.length > 0) {
      const lines = exams
        .map((e, i) => {
          const net = e.correct - e.wrong * 0.25;
          return `${i + 1}. ${e.name} (${e.type}) - ${net.toFixed(1)} net, ${e.correct}D/${e.wrong}Y, ${e.time} dk`;
        })
        .join("\n");
      contextParts.push(`Öğrencinin son deneme sonuçları:\n${lines}`);
    }
    if (studyField) contextParts.push(`Alan: ${studyField}`);

    const systemContext = contextParts.length > 0
      ? `\n[Bağlam]\n${contextParts.join("\n")}\n`
      : "";

    const contents: { role: string; parts: { text: string }[] }[] = [
      {
        role: "user",
        parts: [{
          text: `Sen YKS hazırlık koçusun.${systemContext}Öğrenci sana soru soruyor. Kısa, motive edici ve gerçekçi yanıt ver. Türkçe yaz. 3 cümleyi geçme.`,
        }],
      },
      {
        role: "model",
        parts: [{ text: "Anladım. Deneme sonuçların ve hedeflerinle ilgili sorularını yanıtlamaya hazırım." }],
      },
    ];

    const prevMessages = (body.messages ?? []) as { role: string; content: string }[];
    for (const m of prevMessages.slice(-6)) {
      contents.push({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: message.trim() }],
    });

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: 200,
            temperature: 0.7,
          },
        }),
      }
    );

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      const errMsg = (geminiData as { error?: { message?: string } })?.error?.message ?? "Gemini API hatası";
      return NextResponse.json({ reply: null, error: errMsg }, { status: 502 });
    }

    const text =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;

    return NextResponse.json({ reply: text });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "Beklenmeyen hata";
    return NextResponse.json({ reply: null, error: errMsg });
  }
}
