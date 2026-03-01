import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { filterSubjectDetailsByField } from "@/lib/exam-config";
import type { StudyField } from "@/lib/study-field";

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
    const exams = body.exams as ExamSummary[];
    const studyField = body.studyField as string | null;

    if (!exams || exams.length === 0) {
      return NextResponse.json({ insight: null });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI servisi yapılandırılmamış. Vercel'de GROQ_API_KEY tanımlayın." },
        { status: 500 }
      );
    }

    const examLines = exams
      .map((e, i) => {
        const net = e.correct - e.wrong * 0.25;
        const filteredDetails = filterSubjectDetailsByField(
          e.subject_details,
          e.type?.toLowerCase() ?? "tyt",
          studyField as StudyField | null
        );
        let line = `${i + 1}. ${e.name} (${e.type.toUpperCase()}) - ${net.toFixed(1)} net, ${e.correct}D/${e.wrong}Y, ${e.time} dk`;
        if (filteredDetails && Object.keys(filteredDetails).length > 0) {
          const details = Object.entries(filteredDetails)
            .map(([s, d]) => `${s}: ${d.correct}D/${d.wrong}Y`)
            .join(", ");
          line += ` [${details}]`;
        }
        return line;
      })
      .join("\n");

    const netValues = exams.map((e) => e.correct - e.wrong * 0.25);
    const avgNet = netValues.reduce((a, b) => a + b, 0) / netValues.length;

    const prompt = `Sen bir YKS koçusun. Öğrencinin son ${exams.length} deneme sonucunu analiz et.
${studyField ? `Öğrencinin alanı: ${studyField}` : ""}

Sonuçlar (yeniden eskiye):
${examLines}

Son ${exams.length} deneme ortalaması: ${avgNet.toFixed(1)} net

${
  (() => {
    const fd = filterSubjectDetailsByField(exams[0]?.subject_details ?? null, exams[0]?.type?.toLowerCase() ?? "tyt", studyField as StudyField | null);
    return fd && Object.keys(fd).length > 0;
  })()
    ? "Ders detayları girilmiş - hangi derste odaklanması gerektiğini belirt."
    : "Ders detayı girilmemiş - genel net/süre dengesini değerlendir."
}

ÖNEMLİ: 2 cümleyi GEÇME. Motive edici ama gerçekçi ol. Kısa ve öz yaz. Türkçe yaz.`;

    const modelName = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    const groqData = await groqRes.json();

    if (!groqRes.ok) {
      const errMsg = (groqData as { error?: { message?: string } })?.error?.message ?? "Groq API hatası";
      return NextResponse.json({ insight: null, error: errMsg }, { status: 502 });
    }

    const text =
      (groqData as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content?.trim() ?? null;

    return NextResponse.json({ insight: text });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "Beklenmeyen hata";
    return NextResponse.json({ insight: null, error: errMsg });
  }
}
