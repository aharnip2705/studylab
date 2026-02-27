"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getIsAdmin } from "@/lib/actions/profile";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

const PROGRAM_ID = "11111111-1111-1111-1111-111111111111";
const BUCKET = "subject-icons";
const MAX_SIZE = 1024 * 1024; // 1MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

function isBucketNotFound(err: { message?: string } | null): boolean {
  const msg = (err?.message ?? "").toLowerCase();
  return msg.includes("bucket") && (msg.includes("not found") || msg.includes("bulunamadı"));
}

export async function getAdminSubjects() {
  noStore();
  if (!(await getIsAdmin())) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("id, name, slug, icon_url")
    .eq("program_id", PROGRAM_ID)
    .order("sort_order");
  return data ?? [];
}

export async function updateSubjectIcon(id: string, icon_url: string | null) {
  if (!(await getIsAdmin())) return { error: "Yetkiniz yok" };
  const supabase = await createClient();
  const val = icon_url?.trim();
  const { error } = await supabase
    .from("subjects")
    .update({ icon_url: val || null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/admin/dersler");
  return { success: true };
}

/** Bilgisayardan yüklenen dosyayı Storage'a atar ve dersin icon_url'ini günceller */
export async function uploadSubjectIconFile(
  subjectId: string,
  formData: FormData
): Promise<{ error?: string }> {
  if (!(await getIsAdmin())) return { error: "Yetkiniz yok" };

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) return { error: "Dosya seçilmedi" };
  if (file.size > MAX_SIZE) return { error: "Dosya 1 MB'dan küçük olmalı" };
  if (!ALLOWED_TYPES.includes(file.type))
    return { error: "Sadece resim dosyaları (JPEG, PNG, GIF, WebP, SVG) yüklenebilir" };

  const supabase = await createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const safeExt = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext) ? ext : "png";
  const path = `${subjectId}-${Date.now()}.${safeExt}`;

  let uploadError: { message: string } | null = null;
  let uploadResult = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  uploadError = uploadResult.error;

  // Bucket yoksa Service Role ile oluşturmayı dene (SUPABASE_SERVICE_ROLE_KEY gerekir)
  if (uploadError && isBucketNotFound(uploadError)) {
    try {
      const admin = createAdminClient();
      await admin.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_SIZE,
        allowedMimeTypes: ALLOWED_TYPES,
      });
      uploadResult = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      uploadError = uploadResult.error;
    } catch {
      return {
        error: `"${BUCKET}" bucket'ı bulunamadı. Supabase Dashboard > Storage > New bucket > Name: subject-icons, Public: Açık deyin. Veya .env.local'e SUPABASE_SERVICE_ROLE_KEY ekleyip tekrar deneyin.`,
      };
    }
  }

  if (uploadError) {
    if (isBucketNotFound(uploadError))
      return {
        error: `Storage bucket bulunamadı. Supabase Dashboard > Storage > "New bucket" > Name tam olarak: subject-icons, Public: Açık. Kaydedin ve tekrar deneyin.`,
      };
    return { error: uploadError.message };
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  const { error: updateError } = await supabase
    .from("subjects")
    .update({ icon_url: publicUrl })
    .eq("id", subjectId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/admin/dersler");
  return {};
}
