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

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI servisi yapılandırılmamış. Vercel'de GROQ_API_KEY tanımlayın." },
        { status: 500 }
      );
    }

    const contextParts: string[] = [];
    if (exams.length > 0) {
      const lines = exams
        .map((e, i) => {
          const net = e.correct - e.wrong * 0.25;
          let line = `${i + 1}. ${e.name} (${e.type}) - ${net.toFixed(1)} net, ${e.correct}D/${e.wrong}Y, ${e.time} dk`;
          if (e.subject_details && Object.keys(e.subject_details).length > 0) {
            const details = Object.entries(e.subject_details)
              .map(([subj, d]) => {
                const sNet = d.correct - d.wrong * 0.25;
                return `${subj}: ${sNet.toFixed(1)} net (${d.correct}D/${d.wrong}Y)`;
              })
              .join(" | ");
            line += `\n   Ders detayı: ${details}`;
          }
          return line;
        })
        .join("\n");
      contextParts.push(`Öğrencinin son deneme sonuçları (veriye dayanarak konuş):\n${lines}`);
    }
    if (studyField) contextParts.push(`Alan: ${studyField}`);

    const systemContext = contextParts.length > 0
      ? `\n[Bağlam]\n${contextParts.join("\n")}\n`
      : "";

    const prevMessages = (body.messages ?? []) as { role: string; content: string }[];
    const recentUserText = [...prevMessages].reverse().find((m) => m.role === "user")?.content ?? "";

    const isPlanRequest =
      /program\s*oluştur|program\s*hazırla|plan\s*oluştur|plan\s*hazırla|haftalık\s*plan|program\s*yap|e\s+hadi\s+oluştur|oluştur\s+program|hazırla\s+program|hafta\s*için\s*program|bu\s*hafta\s*için|tyt\s*için\s*program|ayt\s*için\s*program/i.test(message) ||
      /^(e\s+)?hadi\s+(oluştur|hazırla|yap)|^(evet\s+)?oluştur|^(tamam\s+)?hazırla$/i.test(message.trim()) ||
      (recentUserText.length > 20 && /program|plan|haftalık/i.test(recentUserText) && /^(evet|e|tamam|hadi|olur|olsun)/i.test(message.trim()));

    const systemPrompt = isPlanRequest
      ? `Sen veri odaklı bir YKS hazırlık koçusun.${systemContext}
Kullanıcı haftalık çalışma programı istiyor. Mesajındaki net sayılarını ve belirttiği konuları MUTLAKA kullan. Zayıflığı net oranına göre belirle (net/maxSoru), mutlak net sayısıyla değil. Düşük oranlı derslere daha fazla süre ayır.

YANITIN SADECE AŞAĞIDAKİ JSON OLSUN. Markdown, açıklama, \`\`\`json veya başka metin EKLEME. Sadece geçerli JSON döndür:
{"plan":[{"day":"Pazartesi","tasks":[{"subject":"Türkçe","duration_minutes":90,"description":"Fiilimsiler konu tekrarı ve soru çözümü"}]},{"day":"Salı","tasks":[{"subject":"Matematik","duration_minutes":120,"description":"Problemler - oran orantı soru çözümü"}]},{"day":"Çarşamba","tasks":[]},{"day":"Perşembe","tasks":[]},{"day":"Cuma","tasks":[]},{"day":"Cumartesi","tasks":[]},{"day":"Pazar","tasks":[]}]}

Kurallar: Haftanın 7 günü (Pazartesi-Pazar). Her günde 2-4 görev. subject: Türkçe, Matematik, Fizik, Kimya, Biyoloji, Edebiyat, Tarih, Coğrafya, Felsefe, Sosyal. duration_minutes tam sayı (60-120 arası). description kısa, belirtilen konuya uygun olsun.`
      : `Sen sıcak, samimi ve insan gibi konuşan bir YKS hazırlık koçusun.${systemContext}
Kullanıcıya "sen" diye hitap et, "öğrenci" deme. Arkadaş gibi sohbet et, robot gibi kuru cevaplar verme. Bazen kısa sorular sor, empati göster, motive et. Türkçe yaz. Doğal cümleler kur. Gerektiğinde hafif mizah kat. Maksimum 4-5 cümle ama samimi olsun. Zayıf ders değerlendirmesi yaparken o dersin toplam soru sayısını dikkate al.`;

    const modelName = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

    // Groq OpenAI uyumlu API kullanımı
    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...prevMessages.slice(-12).map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
      { role: "user", content: message.trim() },
    ];

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: groqMessages,
        max_tokens: isPlanRequest ? 2000 : 500,
        temperature: isPlanRequest ? 0.3 : 0.8,
      }),
    });

    const groqData = await groqRes.json();

    if (!groqRes.ok) {
      const errMsg = (groqData as { error?: { message?: string } })?.error?.message ?? "Groq API hatası";
      return NextResponse.json({ reply: null, error: errMsg }, { status: 502 });
    }

    let text: string | null =
      (groqData as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content?.trim() ?? null;

    if (isPlanRequest && text) {
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
          .filter((d): d is { day: string; tasks?: unknown[] } => d !== null && typeof d === "object" && "day" in (d as Record<string, unknown>))
          .map((d) => ({
            day: String(d.day),
            tasks: (Array.isArray(d.tasks) ? d.tasks : [])
              .filter((t): t is Record<string, unknown> => t !== null && t !== undefined && typeof t === "object")
              .map((t) => ({
                subject: String(t.subject ?? "Ders"),
                duration_minutes: Number(t.duration_minutes ?? t.duration ?? 60) || 60,
                description: String(t.description ?? ""),
              })),
          }));
      }

      if (planData && planData.length > 0) {
        const summary = planData
          .map((d) => {
            const tasksStr = d.tasks.map((t) => `${t.subject} (${t.duration_minutes} dk) - ${t.description}`).join("\n  • ");
            return `${d.day}:\n  • ${tasksStr || "Dinlenme"}`;
          })
          .join("\n\n");
        return NextResponse.json({
          reply: summary,
          plan: planData,
        });
      }

      return NextResponse.json({
        reply: "Program formatı tanınamadı. Lütfen tekrar deneyin veya 'Haftalık program hazırla' diye yeniden yazın.",
      });
    }

    return NextResponse.json({ reply: text });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "Beklenmeyen hata";
    return NextResponse.json({ reply: null, error: errMsg });
  }
}
