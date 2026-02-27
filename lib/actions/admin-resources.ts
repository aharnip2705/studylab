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
  const { data } = await supabase
    .from("resources")
    .select("id, name, resource_type, icon_url, publisher_id, publishers(id, name)")
    .eq("program_id", PROGRAM_ID)
    .order("resource_type")
    .order("name");
  return data ?? [];
}

export async function addResource(formData: {
  name: string;
  resource_type: ResourceType;
  publisher_id: string;
  icon_url?: string;
}) {
  if (!(await getIsAdmin())) return { error: "Yetkiniz yok" };
  const supabase = createAdminClient();
  const { error } = await supabase.from("resources").insert({
    name: formData.name.trim(),
    resource_type: formData.resource_type,
    program_id: PROGRAM_ID,
    publisher_id: formData.publisher_id || null,
    icon_url: formData.icon_url?.trim() || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/kaynaklar");
  return { success: true };
}

export async function updateResource(
  id: string,
  updates: Partial<{ name: string; resource_type: ResourceType; icon_url: string | null; publisher_id: string | null }>
) {
  if (!(await getIsAdmin())) return { error: "Yetkiniz yok" };
  const supabase = createAdminClient();
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.resource_type !== undefined) payload.resource_type = updates.resource_type;
  if (updates.icon_url !== undefined) payload.icon_url = updates.icon_url?.trim() || null;
  if (updates.publisher_id !== undefined) payload.publisher_id = updates.publisher_id || null;
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

/** Kaynak isimlerindeki yayınevi adlarını eşleştirir; tüm kaynakların icon_url'ini yayınevlerinin logosuyla günceller */
export async function syncResourcePublishersAndIcons(): Promise<
  | { error: string }
  | { success: true; nameMatchesUpdated: number; iconsUpdated: number }
> {
  if (!(await getIsAdmin())) return { error: "Yetkiniz yok" };

  const supabase = createAdminClient();

  // 1. Tüm yayınevlerini al (uzun isim önce - daha iyi eşleşme için)
  const { data: pubs } = await supabase
    .from("publishers")
    .select("id, name, logo_url")
    .eq("program_id", PROGRAM_ID)
    .order("name");

  const publishers = (pubs ?? []).filter((p) => (p.name ?? "").trim());
  const sortedByLen = [...publishers].sort((a, b) => (b.name?.length ?? 0) - (a.name?.length ?? 0));

  // 2. Tüm kaynakları al
  const { data: resources } = await supabase
    .from("resources")
    .select("id, name, publisher_id")
    .eq("program_id", PROGRAM_ID);

  let nameMatchesUpdated = 0;
  for (const r of resources ?? []) {
    const name = (r.name ?? "").trim().toLowerCase();
    if (!name) continue;
    for (const p of sortedByLen) {
      const pubName = (p.name ?? "").trim().toLowerCase();
      if (!pubName || !name.includes(pubName)) continue;
      if (r.publisher_id === p.id) break;
      const { error } = await supabase
        .from("resources")
        .update({ publisher_id: p.id })
        .eq("id", r.id);
      if (!error) nameMatchesUpdated++;
      break;
    }
  }

  // 3. Yayınevi logosu olan kaynakların icon_url'ini güncelle (publisher_id + logo_url olan yayınevleri)
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
  return { success: true, nameMatchesUpdated, iconsUpdated };
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
