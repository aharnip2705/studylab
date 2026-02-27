-- Admin kolonu profiles tablosuna ekle
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Hedeflenen süre (dakika) plan_tasks tablosuna ekle
ALTER TABLE public.plan_tasks ADD COLUMN IF NOT EXISTS target_duration INT DEFAULT 0;

-- Deneme görevleri için subject_id nullable yapılıyor
ALTER TABLE public.plan_tasks ALTER COLUMN subject_id DROP NOT NULL;

-- Resources tablosuna resource_type ekleniyor (ders / deneme)
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS resource_type TEXT DEFAULT 'ders';

-- CHECK constraint ekle
ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_resource_type_check;
ALTER TABLE public.resources ADD CONSTRAINT resources_resource_type_check 
  CHECK (resource_type IN ('ders', 'deneme'));

-- Mevcut kaynakları 'ders' olarak işaretle
UPDATE public.resources SET resource_type = 'ders' WHERE resource_type IS NULL OR resource_type = 'ders';

-- Apotemi Problemler ders kaynağı ekle
INSERT INTO public.resources (name, program_id, resource_type)
SELECT 'Apotemi Problemler', '11111111-1111-1111-1111-111111111111', 'ders'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE name = 'Apotemi Problemler');

-- Deneme kaynakları ekle
INSERT INTO public.resources (name, program_id, resource_type)
SELECT r.name, '11111111-1111-1111-1111-111111111111', 'deneme'
FROM (VALUES
  ('TYT Denemesi'),
  ('AYT Denemesi'),
  ('Apotemi Denemesi'),
  ('Karekök TYT Denemesi'),
  ('Palme AYT Denemesi'),
  ('Referans Yayınları Denemesi'),
  ('Orijinal Yayınları Denemesi')
) AS r(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.resources 
  WHERE resource_type = 'deneme' AND program_id = '11111111-1111-1111-1111-111111111111'
  LIMIT 1
);
