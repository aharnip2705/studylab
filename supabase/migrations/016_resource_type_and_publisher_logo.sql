-- Publishers tablosuna logo_url ekle
ALTER TABLE public.publishers ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- resource_type: 4 tip (soru_bankasi, video_ders_kitabi, deneme_sinavi, diger)
-- ÖNCE constraint'i kaldır, SONRA veriyi güncelle, EN SONRA yeni constraint ekle
ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_resource_type_check;

-- Eski değerleri yeni tiplere map et (constraint yokken)
UPDATE public.resources SET resource_type = 'deneme_sinavi' WHERE resource_type = 'deneme';
UPDATE public.resources SET resource_type = 'soru_bankasi' WHERE resource_type = 'ders';
UPDATE public.resources SET resource_type = 'soru_bankasi' WHERE resource_type IS NULL
  OR resource_type NOT IN ('soru_bankasi', 'video_ders_kitabi', 'deneme_sinavi', 'diger');

ALTER TABLE public.resources ADD CONSTRAINT resources_resource_type_check
  CHECK (resource_type IN ('soru_bankasi', 'video_ders_kitabi', 'deneme_sinavi', 'diger'));

-- publisher-logos storage politikaları (bucket'ı Dashboard'dan oluşturun: publisher-logos, Public: ON)
DROP POLICY IF EXISTS "Admin publisher-logos yükleyebilir" ON storage.objects;
CREATE POLICY "Admin publisher-logos yükleyebilir"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'publisher-logos'
  AND (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

DROP POLICY IF EXISTS "Admin publisher-logos silebilir" ON storage.objects;
CREATE POLICY "Admin publisher-logos silebilir"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'publisher-logos'
  AND (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

DROP POLICY IF EXISTS "publisher-logos herkese açık okuma" ON storage.objects;
CREATE POLICY "publisher-logos herkese açık okuma"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'publisher-logos');
