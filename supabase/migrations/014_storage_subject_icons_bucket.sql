-- Ders sembolleri için Storage: bucket'ı Dashboard'dan oluşturun.
-- Supabase Dashboard > Storage > New bucket > Name: subject-icons, Public: ON, File size limit: 1 MB.
-- Sonra bu migration'daki politikaları SQL Editor'da çalıştırın.

-- Sadece admin kullanıcılar bu bucket'a dosya yükleyebilir
CREATE POLICY "Admin subject-icons yükleyebilir"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'subject-icons'
  AND (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Yüklenen dosyayı silebilmek (güncelleme için önce silinir)
CREATE POLICY "Admin subject-icons silebilir"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'subject-icons'
  AND (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Herkes (public bucket) okuyabilsin
CREATE POLICY "subject-icons herkese açık okuma"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'subject-icons');
