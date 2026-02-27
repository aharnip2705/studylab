-- profiles tablosuna study_field ekle
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS study_field TEXT DEFAULT 'esit_agirlik';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_study_field_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_study_field_check
  CHECK (study_field IN ('esit_agirlik', 'sayisal', 'sozel', 'dil', 'tyt'));

-- Yabancı Dil dersi (dil alanı için)
INSERT INTO public.subjects (program_id, name, slug, sort_order)
SELECT '11111111-1111-1111-1111-111111111111', 'Yabancı Dil', 'yabanci-dil', 11
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE slug = 'yabanci-dil');
