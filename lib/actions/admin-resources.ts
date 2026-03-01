"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/actions/profile";
import { revalidatePath } from "next/cache";

const PROGRAM_ID = "11111111-1111-1111-1111-111111111111";
const PUBLISHER_LOGOS_BUCKET = "publisher-logos";
const MAX_SIZE = 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

type ResourceType = "soru_bankasi" | "video_ders_kitabi" | "deneme_sinavi" | "diger";

function isBucketNotFound(err: { message?: string } | null): boolean {
  const msg = (err?.message ?? "").toLowerCase();
  return msg.includes("bucket") && (msg.includes("not found") || msg.includes("bulunamadı"));
}

export async function getAdminPublishers() {
  if (!(await getIsAdmin())) return [];
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("publishers")
    .select("id, name, sort_order, logo_url")
    .eq("program_id", PROGRAM_ID)
    .order("sort_order")
    .order("name");
  return data ?? [];
}

export async function addPublisher(name: string) {
  if (!(await getIsAdmin())) return { error: "Yetkiniz yok" };
  const supabase = createAdminClient();
  const { error } = await supabase.from("publishers").insert({
    program_id: PROGRAM_ID,
    name: name.trim(),
    sort_order: 0,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/kaynaklar");
  return { success: true };
}

export async function updatePublisher(id: string, name: string, logo_url?: string | null) {
  if (!(await getIsAdmin())) return { error: "Yetkiniz yok" };
  const supabase = createAdminClient();
  const updates: { name: string; logo_url?: string | null } = { name: name.trim() };
  if (logo_url !== undefined) updates.logo_url = logo_url?.trim() || null;
  const { error } = await supabase.from("publishers").update(updates).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/kaynaklar");
  return { success: true };
}

export async function uploadPublisherLogoFile(publisherId: string, formData: FormData) {
  if (!(await getIsAdmin())) return { error: "Yetkiniz yok" };

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) return { error: "Dosya seçilmedi" };
  if (file.size > MAX_SIZE) return { error: "Dosya 1 MB'dan küçük olmalı" };
  if (!ALLOWED_TYPES.includes(file.type))
    return { error: "Sadece resim dosyaları (JPEG, PNG, GIF, WebP, SVG) yüklenebilir" };

  const supabase = await createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const safeExt = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext) ? ext : "png";
  const path = `${publisherId}-${Date.now()}.${safeExt}`;

  let uploadError: { message: string } | null = null;
  let uploadResult = await supabase.storage
    .from(PUBLISHER_LOGOS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  uploadError = uploadResult.error;

  if (uploadError && isBucketNotFound(uploadError)) {
    try {
      const admin = createAdminClient();
      await admin.storage.createBucket(PUBLISHER_LOGOS_BUCKET, {
        public: true,
        fileSizeLimit: MAX_SIZE,
        allowedMimeTypes: ALLOWED_TYPES,
      });
      uploadResult = await supabase.storage
        .from(PUBLISHER_LOGOS_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      uploadError = uploadResult.error;
    } catch {
      return { error: "publisher-logos bucket'ı oluşturulamadı. Supabase Dashboard'dan manuel ekleyin." };
    }
  }

  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = supabase.storage.from(PUBLISHER_LOGOS_BUCKET).getPublicUrl(path);
  const admin = createAdminClient();
  const { error: updateError } = await admin.from("publishers").update({ logo_url: urlData.publicUrl }).eq("id", publisherId);
  if (updateError) return { error: updateError.message };

  revalidatePath("/dashboard/admin/kaynaklar");
  return { success: true };
}

export async function deletePublisher(id: string) {
  if (!(await getIsAdmin())) return { error: "Yetkiniz yok" };
  const supabase = createAdminClient();
  const { error } = await supabase.from("publishers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/kaynaklar");
  return { success: true };
}

export async function getAdminResources() {
  if (!(await getIsAdmin())) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("resources")
    .select("id, name, resource_type, icon_url, publisher_id, subject_id, publishers(id, name), subjects(id, name)")
    .eq("program_id", PROGRAM_ID)
    .order("resource_type")
    .order("name");
  if (error) {
    const { data: fallbackData } = await supabase
      .from("resources")
      .select("id, name, resource_type, icon_url, publisher_id, publishers(id, name)")
      .eq("program_id", PROGRAM_ID)
      .order("resource_type")
      .order("name");
    return (fallbackData ?? []).map((r) => ({ ...r, subject_id: null, subjects: null }));
  }
  return data ?? [];
}

export async function addResource(formData: {
  name: string;
  resource_type: ResourceType;
  publisher_id: string;
  icon_url?: string;
  subject_id?: string | null;
}) {
  if (!(await getIsAdmin())) return { error: "Yetkiniz yok" };
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {
    name: formData.name.trim(),
    resource_type: formData.resource_type,
    program_id: PROGRAM_ID,
    publisher_id: formData.publisher_id || null,
    icon_url: formData.icon_url?.trim() || null,
  };
  if (formData.subject_id !== undefined) payload.subject_id = formData.subject_id || null;
  const { error } = await supabase.from("resources").insert(payload);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/kaynaklar");
  return { success: true };
}

export async function updateResource(
  id: string,
  updates: Partial<{ name: string; resource_type: ResourceType; icon_url: string | null; publisher_id: string | null; subject_id: string | null }>
) {
  if (!(await getIsAdmin())) return { error: "Yetkiniz yok" };
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.resource_type !== undefined) payload.resource_type = updates.resource_type;
  if (updates.icon_url !== undefined) payload.icon_url = updates.icon_url?.trim() || null;
  if (updates.publisher_id !== undefined) payload.publisher_id = updates.publisher_id || null;
  if (updates.subject_id !== undefined) payload.subject_id = updates.subject_id || null;
  const { error } = await supabase.from("resources").update(payload).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/kaynaklar");
  return { success: true };
}

export async function deleteResource(id: string) {
  if (!(await getIsAdmin())) return { error: "Yetkiniz yok" };
  const supabase = createAdminClient();
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/kaynaklar");
  return { success: true };
}

export async function deleteResources(ids: string[]) {
  if (!(await getIsAdmin())) return { error: "Yetkiniz yok" };
  if (!ids.length) return { error: "Silinecek kaynak seçilmedi" };
  const supabase = createAdminClient();
  const { error } = await supabase.from("resources").delete().in("id", ids);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/kaynaklar");
  return { success: true };
}

/** Ders adından subject_id bulma için anahtar kelime eşlemesi */
const SUBJECT_KEYWORDS: Record<string, string[]> = {
  matematik: ["matematik", "math", "sayısal", "türev", "integral", "geometri", "üçgen", "polinomlar", "fonksiyon"],
  türkçe: ["türkçe", "türk dili", "fiilimsi", "paragraf", "sözcük", "anlam"],
  fizik: ["fizik", "kuvvet", "hareket", "elektrik", "optik", "dalgalar"],
  kimya: ["kimya", "asit", "baz", "tuz", "organik", "mol", "element"],
  biyoloji: ["biyoloji", "hücre", "genetik", "ekosistem", "canlı"],
  tarih: ["tarih", "osmanlı", "cumhuriyet", "inkılap"],
  coğrafya: ["coğrafya", "iklim", "nüfus", "harita"],
  felsefe: ["felsefe", "mantık", "psikoloji", "sosyoloji"],
  edebiyat: ["edebiyat", "şiir", "roman", "hikaye", "divan"],
  "din kültürü": ["din kültürü", "din kültürü"],
};

function guessSubjectIdFromName(name: string, subjects: { id: string; name: string }[]): string | null {
  const norm = name.toLowerCase();
  for (const s of subjects) {
    if (norm.includes(s.name.toLowerCase())) return s.id;
  }
  for (const [subjKey, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (keywords.some((kw) => norm.includes(kw))) {
      const match = subjects.find((s) => s.name.toLowerCase().includes(subjKey));
      if (match) return match.id;
    }
  }
  return null;
}

function guessResourceTypeFromName(name: string): ResourceType {
  const norm = name.toLowerCase();
  if (norm.includes("deneme") || norm.includes("full") || norm.includes("kamp")) return "deneme_sinavi";
  if (norm.includes("video") || norm.includes("ders") || norm.includes("anlatım")) return "video_ders_kitabi";
  if (
    norm.includes("soru") ||
    norm.includes("paragraf") ||
    norm.includes("test") ||
    norm.includes("konu") ||
    norm.includes("tyt") ||
    norm.includes("ayt")
  )
    return "soru_bankasi";
  return "diger";
}

/** Kaynak isimlerindeki yayınevi adlarını eşleştirir; tüm kaynakların icon_url, subject_id, resource_type alanlarını günceller */
export async function syncResourcePublishersAndIcons(): Promise<
  | { error: string }
  | {
      success: true;
      nameMatchesUpdated: number;
      iconsUpdated: number;
      subjectsUpdated: number;
      typesUpdated: number;
    }
> {
  if (!(await getIsAdmin())) return { error: "Yetkiniz yok" };

  const supabase = createAdminClient();

  // 1. Yayınevleri ve dersler
  const { data: pubs } = await supabase
    .from("publishers")
    .select("id, name, logo_url")
    .eq("program_id", PROGRAM_ID)
    .order("name");

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("program_id", PROGRAM_ID);

  const publishers = (pubs ?? []).filter((p) => (p.name ?? "").trim());
  const subjectList = subjects ?? [];
  const sortedByLen = [...publishers].sort((a, b) => (b.name?.length ?? 0) - (a.name?.length ?? 0));

  // 2. Tüm kaynakları al (publisher_id, subject_id, resource_type dahil)
  const { data: resources } = await supabase
    .from("resources")
    .select("id, name, publisher_id, subject_id, resource_type")
    .eq("program_id", PROGRAM_ID);

  let nameMatchesUpdated = 0;
  let subjectsUpdated = 0;
  let typesUpdated = 0;

  for (const r of resources ?? []) {
    const name = (r.name ?? "").trim().toLowerCase();
    if (!name) continue;

    const updates: Record<string, unknown> = {};

    // Yayınevi eşleştirme
    for (const p of sortedByLen) {
      const pubName = (p.name ?? "").trim().toLowerCase();
      if (!pubName || !name.includes(pubName)) continue;
      if (r.publisher_id !== p.id) {
        updates.publisher_id = p.id;
        nameMatchesUpdated++;
      }
      break;
    }

    // Ders kategorisi (subject_id) eşleştirme
    const guessedSubjectId = guessSubjectIdFromName(name, subjectList);
    if (guessedSubjectId && r.subject_id !== guessedSubjectId) {
      updates.subject_id = guessedSubjectId;
      subjectsUpdated++;
    }

    // Kaynak tipi eşleştirme (paragraf/soru kitapları "diger" yerine soru_bankasi)
    const guessedType = guessResourceTypeFromName(name);
    if (guessedType !== "diger" && r.resource_type !== guessedType) {
      updates.resource_type = guessedType;
      typesUpdated++;
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from("resources").update(updates).eq("id", r.id);
    }
  }

  // 3. Yayınevi logosu olan kaynakların icon_url'ini güncelle
  const pubLogoMap = new Map<string, string>();
  for (const p of publishers) {
    if (p.logo_url?.trim()) pubLogoMap.set(p.id, p.logo_url.trim());
  }

  const { data: resourcesWithPublisher } = await supabase
    .from("resources")
    .select("id, publisher_id")
    .eq("program_id", PROGRAM_ID)
    .not("publisher_id", "is", null);

  let iconsUpdated = 0;
  for (const r of resourcesWithPublisher ?? []) {
    if (!r.publisher_id) continue;
    const logo = pubLogoMap.get(r.publisher_id);
    if (!logo) continue;

    const { error: updErr } = await supabase
      .from("resources")
      .update({ icon_url: logo })
      .eq("id", r.id);

    if (!updErr) iconsUpdated++;
  }

  revalidatePath("/dashboard/admin/kaynaklar");
  return {
    success: true,
    nameMatchesUpdated,
    iconsUpdated,
    subjectsUpdated,
    typesUpdated,
  };
}

/** kitaplar.json dosyasındaki scraped verileri panele aktarır */
export async function importKitaplarFromJson(): Promise<
  | { error: string }
  | { success: true; imported: number; skipped: number; alreadyExists: number; publishersCreated: number; firstError?: string }
> {
  if (!(await getIsAdmin())) return { error: "Yetkiniz yok" };

  const fs = await import("fs");
  const path = await import("path");
  const jsonPath = path.join(process.cwd(), "kitaplar.json");

  if (!fs.existsSync(jsonPath)) {
    return { error: "kitaplar.json bulunamadı. Önce 'npm run scrape' ile verileri çekin." };
  }

  let books: Array<{ kaynakAdi: string; yayinevi: string; kaynakTipi: string; gorsel_url?: string | null }>;
  try {
    const raw = fs.readFileSync(jsonPath, "utf-8");
    books = JSON.parse(raw);
    if (!Array.isArray(books)) books = [];
  } catch {
    return { error: "kitaplar.json geçersiz format." };
  }

  const supabase = createAdminClient();
  const { data: existingPublishers } = await supabase
    .from("publishers")
    .select("id, name")
    .eq("program_id", PROGRAM_ID);
  const publisherMap = new Map<string, string>();
  for (const p of existingPublishers ?? []) {
    publisherMap.set(p.name.trim().toLowerCase(), p.id);
  }

  const { data: existingResources } = await supabase
    .from("resources")
    .select("id, name, publisher_id")
    .eq("program_id", PROGRAM_ID);
  const resourceSet = new Set<string>();
  for (const r of existingResources ?? []) {
    resourceSet.add(`${(r.name || "").trim()}|${r.publisher_id || ""}`);
  }

  let imported = 0;
  let skipped = 0;
  let alreadyExists = 0;
  let publishersCreated = 0;
  let firstError: string | undefined;

  const validTypes: ResourceType[] = ["soru_bankasi", "video_ders_kitabi", "deneme_sinavi", "diger"];

  for (const book of books) {
    const name = (book.kaynakAdi || "").trim();
    const publisherName = (book.yayinevi || "").trim();
    if (!name || !publisherName) {
      skipped++;
      continue;
    }

    let publisherId = publisherMap.get(publisherName.toLowerCase());
    if (!publisherId) {
      const { data: newPub, error: insErr } = await supabase
        .from("publishers")
        .insert({ program_id: PROGRAM_ID, name: publisherName, sort_order: 0 })
        .select("id")
        .single();
      if (insErr) {
        if (!firstError) firstError = `Yayınevi eklenemedi (${publisherName}): ${insErr.message}`;
        skipped++;
        continue;
      }
      publisherId = newPub.id;
      if (publisherId) {
        publisherMap.set(publisherName.toLowerCase(), publisherId);
      }
      publishersCreated++;
    }

    const key = `${name}|${publisherId}`;
    if (resourceSet.has(key)) {
      alreadyExists++;
      continue;
    }

    const resourceType = validTypes.includes(book.kaynakTipi as ResourceType)
      ? (book.kaynakTipi as ResourceType)
      : "diger";

    const iconUrl = book.gorsel_url?.trim() || null;

    const { error: resErr } = await supabase.from("resources").insert({
      name,
      resource_type: resourceType,
      program_id: PROGRAM_ID,
      publisher_id: publisherId,
      icon_url: iconUrl,
    });

    if (resErr) {
      if (!firstError)
        firstError = `Kaynak eklenemedi: ${resErr.message}. (Migration 016 uygulandı mı? resource_type: soru_bankasi, deneme_sinavi vb. olmalı)`;
      skipped++;
      continue;
    }
    if (iconUrl) {
      await supabase.from("publishers").update({ logo_url: iconUrl }).eq("id", publisherId).is("logo_url", null);
    }
    resourceSet.add(key);
    imported++;
  }

  revalidatePath("/dashboard/admin/kaynaklar");
  return {
    success: true,
    imported,
    skipped,
    alreadyExists,
    publishersCreated,
    firstError,
  };
}
