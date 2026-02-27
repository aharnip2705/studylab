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

    const prevMessages = (body.messages ?? []) as { role: string; content: string }[];
    const recentUserText = [...prevMessages].reverse().find((m) => m.role === "user")?.content ?? "";

    const wantsPlan =
      /program\s*oluştur|program\s*hazırla|plan\s*oluştur|plan\s*hazırla|haftalık\s*plan|program\s*yap|e\s+hadi\s+oluştur|oluştur\s+program|hazırla\s+program/i.test(message) ||
      /^(e\s+)?hadi\s+(oluştur|hazırla|yap)|^(evet\s+)?oluştur|^(tamam\s+)?hazırla$/i.test(message.trim()) ||
      (recentUserText.length > 20 && /program|plan|haftalık/i.test(recentUserText) && /^(evet|e|tamam|hadi|olur|olsun)/i.test(message.trim()));

    const systemPrompt = wantsPlan
      ? `Sen sıcak ve samimi bir YKS hazırlık koçusun.${systemContext}
Öğrenci haftalık çalışma programı istiyor. SADECE aşağıdaki JSON formatında cevap ver. Başka hiçbir metin, açıklama veya markdown ekleme. Cevabın tek başına geçerli bir JSON olsun:
{"plan":[{"day":"Pazartesi","tasks":[{"subject":"Türkçe","duration_minutes":90,"description":"Fiilimsiler konu tekrarı ve soru çözümü"}]},{"day":"Salı","tasks":[]},...]}
Haftanın 7 günü: Pazartesi, Salı, Çarşamba, Perşembe, Cuma, Cumartesi, Pazar. Her gün 2-4 görev. subject: Türkçe, Matematik, Fizik, Kimya, Biyoloji, Edebiyat, Tarih, Coğrafya, Felsefe, Sosyal gibi ders adları kullan. duration_minutes sayı olmalı. description kısa ve net olsun.`
      : `Sen sıcak, samimi ve insan gibi konuşan bir YKS hazırlık koçusun.${systemContext}
Öğrenciyle arkadaş gibi sohbet et. Robot gibi, kuru ve yapay cevaplar verme. Bazen kısa sorular sor, empati göster, motive et. Türkçe yaz. Cümleleri doğal tut, "Şunu yapmalısın" gibi emir kipli ifadelerden kaçın. "Bence", "Senin için", "Şöyle düşünüyorum" gibi kişisel ifadeler kullan. Gerektiğinde hafif mizah kat. Maksimum 4-5 cümle ama samimi olsun.`;

    const contents: { role: string; parts: { text: string }[] }[] = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [{ text: wantsPlan ? "Tamam, programı JSON formatında hazırlıyorum." : "Merhaba! Nasılsın? Deneme sonuçların ve hedeflerinle ilgili konuşalım, neye ihtiyacın var?" }],
      },
    ];

    for (const m of prevMessages.slice(-12)) {
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
            maxOutputTokens: wantsPlan ? 2000 : 500,
            temperature: wantsPlan ? 0.3 : 0.8,
          },
        }),
      }
    );

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      const errMsg = (geminiData as { error?: { message?: string } })?.error?.message ?? "Gemini API hatası";
      return NextResponse.json({ reply: null, error: errMsg }, { status: 502 });
    }

    let text =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;

    if (wantsPlan && text) {
      let planData: { day: string; tasks: { subject: string; duration_minutes: number; description: string }[] }[] | null = null;

      function extractPlanArray(raw: string): unknown[] | null {
        const idx = raw.indexOf('"plan"');
        if (idx < 0) return null;
        const start = raw.indexOf("[", idx);
        if (start < 0) return null;
        let depth = 1;
        let i = start + 1;
        while (i < raw.length && depth > 0) {
          const c = raw[i];
          if (c === "[") depth++;
          else if (c === "]") depth--;
          i++;
        }
        if (depth !== 0) return null;
        const arrStr = raw.slice(start, i);
        try {
          return JSON.parse(arrStr) as unknown[];
        } catch {
          try {
            const fixed = arrStr
              .replace(/duration_surprise/g, "duration_minutes")
              .replace(/,\s*}/g, "}");
            return JSON.parse(fixed) as unknown[];
          } catch {
            return null;
          }
        }
      }

      const arr = extractPlanArray(text);
      if (arr && arr.length > 0) {
        planData = arr
          .filter((d): d is { day: string; tasks?: unknown[] } => d && typeof d === "object" && "day" in d)
          .map((d) => ({
            day: String(d.day),
            tasks: (Array.isArray(d.tasks) ? d.tasks : [])
              .filter((t): t is Record<string, unknown> => t && typeof t === "object")
              .map((t) => ({
                subject: String(t.subject ?? "Ders"),
                duration_minutes: Number(t.duration_minutes ?? t.duration ?? 60) || 60,
                description: String(t.description ?? ""),
              })),
          }));
      }

      if (planData && planData.length > 0) {
        const summary = planData
          .map((d) => `**${d.day}:** ${d.tasks.map((t) => `${t.subject} (${t.duration_minutes} dk) - ${t.description}`).join(" | ")}`)
          .join("\n");
        return NextResponse.json({
          reply: summary,
          plan: planData,
        });
      }
    }

    return NextResponse.json({ reply: text });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "Beklenmeyen hata";
    return NextResponse.json({ reply: null, error: errMsg });
  }
}
